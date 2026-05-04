import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { randomUUID } from "crypto";

async function recalculateBalance(tx: typeof prisma, invCode: string) {
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
    create: { inv_code: invCode, qty_on_hand: runningBalance },
    update: { qty_on_hand: runningBalance, last_updated: new Date() },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_RETURN_POST);

    const { id } = await params;

    const warehouseReturn = await prisma.warehouse_returns.findUnique({
      where: { id },
      include: {
        return_items: true,
        t_order: {
          select: { is_historical: true },
        },
      },
    });
    invariant(warehouseReturn, "Warehouse return not found.");
    invariant(
      warehouseReturn.status === "RECEIVED_GOOD" || warehouseReturn.status === "RECEIVED_DAMAGED",
      "Only verified returns (RECEIVED_GOOD / RECEIVED_DAMAGED) can be posted.",
    );
    invariant(
      !warehouseReturn.t_order?.is_historical,
      "Cannot post stock for warehouse return linked to historical sales order.",
    );

    const postedItems: string[] = [];
    const skippedItems: string[] = [];
    const affectedInvCodes = new Set<string>();

    if (warehouseReturn.status === "RECEIVED_GOOD") {
      // RECEIVED_GOOD: post qty_good as real stock movement
      for (const item of warehouseReturn.return_items) {
        // Idempotency guard: check if already posted
        const existing = await prisma.stock_movements.findFirst({
          where: {
            reference_type: "WAREHOUSE_RETURN",
            reference_id: item.id,
          },
          select: { id: true },
        });

        if (existing) {
          skippedItems.push(item.id);
          continue;
        }

        const qtyGood = item.qty_good ?? 0;
        if (qtyGood <= 0) {
          skippedItems.push(item.id);
          continue;
        }

        await prisma.stock_movements.create({
          data: {
            id: randomUUID(),
            movement_date: warehouseReturn.return_date,
            inv_code: item.inv_code,
            reference_type: "WAREHOUSE_RETURN",
            reference_id: item.id,
            qty_change: qtyGood,
            running_balance: 0,
            notes: `Warehouse return good stock for return item ${item.id}`,
          },
        });

        affectedInvCodes.add(item.inv_code);
        postedItems.push(item.id);
      }

      // Recalculate balances for affected inventory codes
      for (const invCode of affectedInvCodes) {
        await recalculateBalance(prisma, invCode);
      }
    } else {
      // RECEIVED_DAMAGED: create tracking movements (qty 0, no stock balance update)
      for (const item of warehouseReturn.return_items) {
        const existing = await prisma.stock_movements.findFirst({
          where: {
            reference_type: "WAREHOUSE_RETURN_DAMAGED",
            reference_id: item.id,
          },
          select: { id: true },
        });

        if (existing) {
          skippedItems.push(item.id);
          continue;
        }

        const qtyDamaged = item.qty_damaged ?? 0;
        if (qtyDamaged <= 0) {
          skippedItems.push(item.id);
          continue;
        }

        await prisma.stock_movements.create({
          data: {
            id: randomUUID(),
            movement_date: warehouseReturn.return_date,
            inv_code: item.inv_code,
            reference_type: "WAREHOUSE_RETURN_DAMAGED",
            reference_id: item.id,
            qty_change: 0,
            running_balance: 0,
            notes: `Warehouse return damaged tracking for return item ${item.id} (qty_damaged=${qtyDamaged})`,
          },
        });

        postedItems.push(item.id);
      }
      // RECEIVED_DAMAGED does not update stock_balances
    }

    const result = await prisma.warehouse_returns.findUnique({
      where: { id },
      include: {
        return_items: {
          include: {
            master_product: {
              select: { sku: true, sku_name: true, product_name: true },
            },
            master_inventory: {
              select: { inv_code: true, inv_name: true },
            },
          },
        },
        t_order: {
          select: { order_no: true, channel_id: true, status: true },
        },
      },
    });

    return NextResponse.json(
      toJsonValue({
        warehouseReturn: result,
        summary: {
          posted: postedItems.length,
          skipped: skippedItems.length,
          total: warehouseReturn.return_items.length,
        },
      }),
    );
  } catch (error) {
    return jsonError(error, "Failed to post warehouse return stock.");
  }
}
