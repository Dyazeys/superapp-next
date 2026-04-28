import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function asUtcDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function ensureInventoryExists(tx: Tx, invCode: string) {
  const inventory = await tx.master_inventory.findUnique({
    where: { inv_code: invCode },
    select: { inv_code: true },
  });

  return Boolean(inventory);
}

async function recalculateBalance(tx: Tx, invCode: string) {
  if (!(await ensureInventoryExists(tx, invCode))) {
    return;
  }

  const movements = await tx.stock_movements.findMany({
    where: { inv_code: invCode },
    orderBy: [{ movement_date: "asc" }, { created_at: "asc" }, { id: "asc" }],
  });

  let runningBalance = 0;

  for (const movement of movements) {
    runningBalance += movement.qty_change;

    await tx.stock_movements.update({
      where: { id: movement.id },
      data: { running_balance: runningBalance },
    });
  }

  await tx.stock_balances.upsert({
    where: { inv_code: invCode },
    create: {
      inv_code: invCode,
      qty_on_hand: runningBalance,
    },
    update: {
      qty_on_hand: runningBalance,
      last_updated: new Date(),
    },
  });
}

export async function recalculateBalances(tx: Tx, invCodes: Iterable<string>) {
  for (const invCode of new Set(Array.from(invCodes).filter(Boolean))) {
    await recalculateBalance(tx, invCode);
  }
}

export async function syncInboundItemMovement(tx: Tx, inboundItemId: string) {
  const item = await tx.inbound_items.findUnique({
    where: { id: inboundItemId },
    include: {
      inbound_deliveries: {
        select: {
          receive_date: true,
        },
      },
    },
  });

  if (!item) {
    return;
  }

  const existing = await tx.stock_movements.findFirst({
    where: {
      reference_type: "INBOUND",
      reference_id: inboundItemId,
    },
  });

  if (item.qty_passed_qc <= 0) {
    if (existing) {
      await tx.stock_movements.delete({ where: { id: existing.id } });
    }
    await recalculateBalance(tx, item.inv_code);
    return;
  }

  const payload = {
    movement_date: asUtcDate(item.inbound_deliveries.receive_date),
    inv_code: item.inv_code,
    reference_type: "INBOUND",
    reference_id: inboundItemId,
    qty_change: item.qty_passed_qc,
    running_balance: 0,
    notes: `Inbound QC accepted for ${inboundItemId}`,
  };

  if (existing) {
    await tx.stock_movements.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await tx.stock_movements.create({
      data: {
        id: randomUUID(),
        ...payload,
      },
    });
  }

  await recalculateBalance(tx, item.inv_code);
}

export async function removeInboundItemMovement(tx: Tx, inboundItemId: string, invCode: string) {
  const existing = await tx.stock_movements.findFirst({
    where: {
      reference_type: "INBOUND",
      reference_id: inboundItemId,
    },
  });

  if (existing) {
    await tx.stock_movements.delete({ where: { id: existing.id } });
  }

  await recalculateBalance(tx, invCode);
}

export async function syncAdjustmentMovement(tx: Tx, adjustmentId: string) {
  const adjustment = await tx.adjustments.findUnique({
    where: { id: adjustmentId },
  });

  if (!adjustment) {
    return;
  }

  const existing = await tx.stock_movements.findFirst({
    where: {
      reference_type: "ADJUSTMENT",
      reference_id: adjustmentId,
    },
  });

  const qtyChange = adjustment.adj_type === "OUT" ? -adjustment.qty : adjustment.qty;
  const payload = {
    movement_date: asUtcDate(adjustment.adjustment_date),
    inv_code: adjustment.inv_code,
    reference_type: "ADJUSTMENT",
    reference_id: adjustmentId,
    qty_change: qtyChange,
    running_balance: 0,
    notes: `Adjustment ${adjustment.adj_type} for ${adjustmentId}`,
  };

  if (existing) {
    await tx.stock_movements.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await tx.stock_movements.create({
      data: {
        id: randomUUID(),
        ...payload,
      },
    });
  }

  await recalculateBalance(tx, adjustment.inv_code);
}

export async function removeAdjustmentMovement(tx: Tx, adjustmentId: string, invCode: string) {
  const existing = await tx.stock_movements.findFirst({
    where: {
      reference_type: "ADJUSTMENT",
      reference_id: adjustmentId,
    },
  });

  if (existing) {
    await tx.stock_movements.delete({ where: { id: existing.id } });
  }

  await recalculateBalance(tx, invCode);
}

export async function syncOperationalExpenseBarterMovements(tx: Tx, barterId: string) {
  const barter = await tx.operational_expense_barter.findUnique({
    where: { id: barterId },
    include: {
      operational_expense_barter_items: {
        select: {
          id: true,
          inv_code: true,
          qty: true,
        },
      },
      accounts_operational_expense_barter_expense_account_idToaccounts: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  });

  const existingMovements = await tx.stock_movements.findMany({
    where: {
      reference_type: "OPERATIONAL_EXPENSE_BARTER",
      reference_id: barterId,
    },
    select: {
      id: true,
      inv_code: true,
    },
  });

  const affectedInvCodes = new Set(existingMovements.map((movement) => movement.inv_code));

  if (!barter || barter.status !== "POSTED") {
    if (existingMovements.length > 0) {
      await tx.stock_movements.deleteMany({
        where: {
          reference_type: "OPERATIONAL_EXPENSE_BARTER",
          reference_id: barterId,
        },
      });
    }
    await recalculateBalances(tx, affectedInvCodes);
    return;
  }

  barter.operational_expense_barter_items.forEach((item) => affectedInvCodes.add(item.inv_code));

  await tx.stock_movements.deleteMany({
    where: {
      reference_type: "OPERATIONAL_EXPENSE_BARTER",
      reference_id: barterId,
    },
  });

  if (barter.operational_expense_barter_items.length > 0) {
    await tx.stock_movements.createMany({
      data: barter.operational_expense_barter_items.map((item) => ({
        movement_date: asUtcDate(barter.barter_date),
        inv_code: item.inv_code,
        reference_type: "OPERATIONAL_EXPENSE_BARTER",
        reference_id: barterId,
        qty_change: -item.qty,
        running_balance: 0,
        notes: `Opex barter ${barter.accounts_operational_expense_barter_expense_account_idToaccounts.code} - ${barter.description}`,
      })),
    });
  }

  await recalculateBalances(tx, affectedInvCodes);
}

async function syncSalesOrderTotal(tx: Tx, orderNo: string) {
  const items = await tx.t_order_item.findMany({
    where: { order_no: orderNo },
    select: {
      qty: true,
      unit_price: true,
      discount_item: true,
    },
  });

  const totalAmount = items
    .reduce((sum, item) => sum + item.qty * Number(item.unit_price), 0)
    .toFixed(2);

  await tx.t_order.update({
    where: { order_no: orderNo },
    data: {
      total_amount: totalAmount,
    },
  });
}

export async function syncSalesOrderItemMovements(tx: Tx, orderItemId: number) {
  const item = await tx.t_order_item.findUnique({
    where: { id: orderItemId },
    include: {
      t_order: true,
      master_product: true,
    },
  });

  const existingMovements = await tx.stock_movements.findMany({
    where: {
      reference_type: "SALE",
      reference_id: String(orderItemId),
    },
    select: {
      id: true,
      inv_code: true,
    },
  });

  const affectedInvCodes = new Set(existingMovements.map((movement) => movement.inv_code));

  if (!item) {
    await tx.stock_movements.deleteMany({
      where: {
        reference_type: "SALE",
        reference_id: String(orderItemId),
      },
    });
    await recalculateBalances(tx, affectedInvCodes);
    return;
  }

  const order = item.t_order;
  if (!order || order.is_historical || !item.order_no || !item.sku) {
    if (item.order_no) {
      await syncSalesOrderTotal(tx, item.order_no);
    }
    await tx.stock_movements.deleteMany({
      where: {
        reference_type: "SALE",
        reference_id: String(orderItemId),
      },
    });
    await recalculateBalances(tx, affectedInvCodes);
    return;
  }

  await syncSalesOrderTotal(tx, item.order_no);
  const sku = item.sku;

  const bomRows = await tx.product_bom.findMany({
    where: {
      sku,
      is_active: true,
      is_stock_tracked: true,
      inv_code: {
        not: null,
      },
    },
    orderBy: [{ sequence_no: "asc" }, { id: "asc" }],
  });

  await tx.stock_movements.deleteMany({
    where: {
      reference_type: "SALE",
      reference_id: String(orderItemId),
    },
  });

  if (!bomRows.length) {
    await recalculateBalances(tx, affectedInvCodes);
    return;
  }

  for (const bom of bomRows) {
    if (!bom.inv_code) continue;
    const qtyChange = -Math.round(Number(bom.qty) * item.qty);
    affectedInvCodes.add(bom.inv_code);

    if (qtyChange === 0) continue;

    await tx.stock_movements.create({
      data: {
        id: randomUUID(),
        movement_date: order.order_date,
        inv_code: bom.inv_code,
        reference_type: "SALE",
        reference_id: String(orderItemId),
        qty_change: qtyChange,
        running_balance: 0,
        notes: `BOM component ${bom.component_name} for sales order item ${orderItemId}`,
      },
    });
  }

  await recalculateBalances(tx, affectedInvCodes);
}

export async function removeSalesOrderItemMovements(tx: Tx, orderItemId: number, orderNo?: string | null) {
  const movements = await tx.stock_movements.findMany({
    where: {
      reference_type: "SALE",
      reference_id: String(orderItemId),
    },
    select: {
      id: true,
      inv_code: true,
    },
  });

  await tx.stock_movements.deleteMany({
    where: {
      reference_type: "SALE",
      reference_id: String(orderItemId),
    },
  });

  await recalculateBalances(
    tx,
    movements.map((movement) => movement.inv_code)
  );

  if (orderNo) {
    await syncSalesOrderTotal(tx, orderNo);
  }
}

export async function syncSalesOrderMovements(tx: Tx, orderNo: string) {
  const items = await tx.t_order_item.findMany({
    where: { order_no: orderNo },
    select: { id: true },
  });

  await syncSalesOrderTotal(tx, orderNo);

  for (const item of items) {
    await syncSalesOrderItemMovements(tx, item.id);
  }
}
