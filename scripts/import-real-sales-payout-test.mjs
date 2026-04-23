import "dotenv/config";
import fs from "fs";
import { createHash, randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
  }),
  log: ["error"],
});

const PAYOUT_JOURNAL_REFERENCE_TYPE = "PAYOUT_SETTLEMENT";
const PAYOUT_ADJUSTMENT_JOURNAL_REFERENCE_TYPE = "PAYOUT_ADJUSTMENT";
const PAYOUT_TRANSFER_JOURNAL_REFERENCE_TYPE = "PAYOUT_BANK_TRANSFER";
const PAYOUT_JOURNAL_NAMESPACE = "superapp:payout-settlement:v1";
const HPP_ACCOUNT_CODE = "51101";
const INVENTORY_ACCOUNT_CODE = "13101";
const DEFAULT_REVENUE_ACCOUNT_CODE = "41106";

const MARKETPLACE_FEE_ACCOUNT_CODE_BY_REVENUE_CODE = {
  "41101": "61107",
  "41102": "61108",
  "41103": "61109",
  "41104": "61110",
  "41105": "61111",
  "41106": "61112",
  "41107": "61113",
};

const TARGET_REFS = [
  "251220UC7GNPR1",
  "251229KTR3DCD3",
  "251212511090QD",
  "251227FUDYD3DK",
  "25122479F1XYAV",
];

function deterministicReferenceId(namespace, value) {
  const hash = createHash("sha1")
    .update(`${namespace}:${value}`)
    .digest("hex")
    .slice(0, 32)
    .split("");

  hash[12] = "5";
  const variant = Number.parseInt(hash[16], 16);
  hash[16] = ((variant & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8).join(""),
    hash.slice(8, 12).join(""),
    hash.slice(12, 16).join(""),
    hash.slice(16, 20).join(""),
    hash.slice(20, 32).join(""),
  ].join("-");
}

function payoutSettlementReferenceId(payoutId) {
  return deterministicReferenceId(PAYOUT_JOURNAL_NAMESPACE, payoutId);
}

function parseCsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const columns = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = columns[index] ?? "";
    });
    return row;
  });
}

function asDateTime(value) {
  return new Date(value);
}

function asDateOnly(value) {
  const datePart = String(value).slice(0, 10);
  return new Date(`${datePart}T00:00:00.000Z`);
}

function asMoney(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function asPositiveMoney(value) {
  return Math.abs(asMoney(value));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function findAccountIdByCode(tx, code) {
  const account = await tx.accounts.findFirst({
    where: { code },
    select: { id: true },
  });

  return account?.id ?? null;
}

async function upsertJournalEntryReplacingLines(tx, params) {
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: params.referenceType,
      reference_id: params.referenceId,
    },
    select: { id: true },
  });

  let journalEntryId = existing?.id ?? null;

  if (!journalEntryId) {
    const created = await tx.journal_entries.create({
      data: {
        transaction_date: params.transactionDate,
        reference_type: params.referenceType,
        reference_id: params.referenceId,
        description: params.description,
      },
      select: { id: true },
    });
    journalEntryId = created.id;
  } else {
    await tx.journal_entries.update({
      where: { id: journalEntryId },
      data: {
        transaction_date: params.transactionDate,
        description: params.description,
        updated_at: new Date(),
      },
    });
  }

  await tx.journal_lines.deleteMany({
    where: { journal_entry_id: journalEntryId },
  });

  if (params.lines.length > 0) {
    await tx.journal_lines.createMany({
      data: params.lines.map((line) => ({
        journal_entry_id: journalEntryId,
        account_id: line.accountId,
        debit: line.debit.toFixed(2),
        credit: line.credit.toFixed(2),
        memo: line.memo,
      })),
    });
  }

  return journalEntryId;
}

async function recalculateBalance(tx, invCode) {
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

async function createPostedAdjustment(tx, params) {
  const created = await tx.adjustments.create({
    data: {
      id: randomUUID(),
      adjustment_date: params.adjustmentDate,
      inv_code: params.invCode,
      adj_type: "IN",
      post_status: "POSTED",
      posted_at: new Date(),
      qty: params.qty,
      reason: "Surplus",
      notes: params.notes,
      created_by: "codex-import",
    },
    select: {
      id: true,
      inv_code: true,
      adjustment_date: true,
      qty: true,
    },
  });

  await tx.stock_movements.create({
    data: {
      id: randomUUID(),
      movement_date: created.adjustment_date,
      inv_code: created.inv_code,
      reference_type: "ADJUSTMENT",
      reference_id: created.id,
      qty_change: created.qty,
      running_balance: 0,
      notes: `Adjustment IN for ${created.id}`,
    },
  });

  await recalculateBalance(tx, created.inv_code);

  return created;
}

async function syncSalesOrderItemMovementAndJournal(tx, orderItemId) {
  const item = await tx.t_order_item.findUnique({
    where: { id: orderItemId },
    include: {
      t_order: {
        include: {
          m_channel: {
            select: {
              channel_id: true,
              channel_name: true,
              piutang_account_id: true,
              revenue_account_id: true,
            },
          },
        },
      },
      master_product: {
        select: {
          total_hpp: true,
        },
      },
    },
  });

  assert(item?.t_order, `Sales order item ${orderItemId} tidak ditemukan.`);
  assert(item.sku, `Sales order item ${orderItemId} tidak punya SKU.`);

  const bomRows = await tx.product_bom.findMany({
    where: {
      sku: item.sku,
      is_active: true,
      is_stock_tracked: true,
      inv_code: { not: null },
    },
    orderBy: [{ sequence_no: "asc" }, { id: "asc" }],
  });

  assert(bomRows.length > 0, `SKU ${item.sku} belum punya BOM stock-tracked aktif.`);

  await tx.stock_movements.deleteMany({
    where: {
      reference_type: "SALE",
      reference_id: String(orderItemId),
    },
  });

  for (const bom of bomRows) {
    if (!bom.inv_code) continue;
    const qtyChange = -Math.round(Number(bom.qty) * item.qty);

    await tx.stock_movements.create({
      data: {
        id: randomUUID(),
        movement_date: item.t_order.order_date,
        inv_code: bom.inv_code,
        reference_type: "SALE",
        reference_id: String(orderItemId),
        qty_change: qtyChange,
        running_balance: 0,
        notes: `BOM component ${bom.component_name} for sales order item ${orderItemId}`,
      },
    });

    await recalculateBalance(tx, bom.inv_code);
  }

  return item;
}

async function syncPayoutSettlementJournal(tx, payoutId) {
  const payout = await tx.t_payout.findUnique({
    where: { payout_id: payoutId },
    select: {
      payout_id: true,
      payout_date: true,
      ref: true,
      payout_status: true,
      total_price: true,
      hpp: true,
      omset: true,
      fee_admin: true,
      fee_service: true,
      fee_order_process: true,
      fee_program: true,
      fee_transaction: true,
      fee_affiliate: true,
    },
  });

  assert(payout, `Payout ${payoutId} tidak ditemukan.`);
  if (String(payout.payout_status ?? "").toUpperCase() === "FAILED" || !payout.ref) {
    return;
  }

  const order = await tx.t_order.findFirst({
    where: { ref_no: payout.ref },
    select: {
      channel_id: true,
    },
  });
  assert(order?.channel_id, `Order untuk payout ref ${payout.ref} tidak punya channel.`);

  const channel = await tx.m_channel.findUnique({
    where: { channel_id: order.channel_id },
    select: {
      channel_name: true,
      revenue_account_id: true,
      saldo_account_id: true,
      revenue_account: {
        select: {
          code: true,
        },
      },
    },
  });

  assert(channel?.saldo_account_id, `Channel ${order.channel_id} belum punya akun saldo.`);
  const revenueAccountId =
    channel.revenue_account_id ?? (await findAccountIdByCode(tx, DEFAULT_REVENUE_ACCOUNT_CODE));
  assert(revenueAccountId, `Akun pendapatan default ${DEFAULT_REVENUE_ACCOUNT_CODE} tidak ditemukan.`);

  const feeComponents = [
    { amount: Number(payout.fee_admin), label: "admin" },
    { amount: Number(payout.fee_service), label: "service" },
    { amount: Number(payout.fee_order_process), label: "order process" },
    { amount: Number(payout.fee_program), label: "program" },
    { amount: Number(payout.fee_transaction), label: "transaction" },
    { amount: Number(payout.fee_affiliate), label: "affiliate" },
  ].filter((component) => Number.isFinite(component.amount) && component.amount > 0);

  let feeExpenseAccountId = null;
  if (feeComponents.length > 0) {
    const feeAccountCode = MARKETPLACE_FEE_ACCOUNT_CODE_BY_REVENUE_CODE[channel.revenue_account?.code ?? ""] ?? null;
    assert(feeAccountCode, `Mapping akun biaya marketplace belum ada untuk channel ${channel.channel_name}.`);
    feeExpenseAccountId = await findAccountIdByCode(tx, feeAccountCode);
    assert(feeExpenseAccountId, `Akun biaya marketplace ${feeAccountCode} tidak ditemukan.`);
  }

  const amount = Number(payout.omset);
  assert(Number.isFinite(amount) && amount > 0, `Omset payout ${payout.ref} tidak valid.`);
  const revenueAmount = Number(payout.total_price);
  assert(Number.isFinite(revenueAmount) && revenueAmount > 0, `Nilai total payout ${payout.ref} tidak valid.`);
  const hppAmount = Number(payout.hpp);

  let hppAccountId = null;
  let inventoryAccountId = null;
  if (Number.isFinite(hppAmount) && hppAmount > 0) {
    hppAccountId = await findAccountIdByCode(tx, HPP_ACCOUNT_CODE);
    inventoryAccountId = await findAccountIdByCode(tx, INVENTORY_ACCOUNT_CODE);
    assert(hppAccountId, `Akun HPP ${HPP_ACCOUNT_CODE} tidak ditemukan.`);
    assert(inventoryAccountId, `Akun persediaan ${INVENTORY_ACCOUNT_CODE} tidak ditemukan.`);
  }

  const lines = [
    {
      accountId: channel.saldo_account_id,
      debit: amount,
      credit: 0,
      memo: `Saldo channel bertambah dari payout ref ${payout.ref}`,
    },
    {
      accountId: revenueAccountId,
      debit: 0,
      credit: revenueAmount,
      memo: `Pendapatan payout untuk ref ${payout.ref}`,
    },
    ...feeComponents.flatMap((component) =>
      feeExpenseAccountId
        ? [
            {
              accountId: feeExpenseAccountId,
              debit: component.amount,
              credit: 0,
              memo: `Biaya marketplace ${component.label} untuk payout ref ${payout.ref}`,
            },
            {
              accountId: channel.saldo_account_id,
              debit: 0,
              credit: component.amount,
              memo: `Saldo channel berkurang untuk biaya ${component.label} payout ref ${payout.ref}`,
            },
          ]
        : []
    ),
    ...(Number.isFinite(hppAmount) && hppAmount > 0 && hppAccountId && inventoryAccountId
      ? [
          {
            accountId: hppAccountId,
            debit: hppAmount,
            credit: 0,
            memo: `HPP payout untuk ref ${payout.ref}`,
          },
          {
            accountId: inventoryAccountId,
            debit: 0,
            credit: hppAmount,
            memo: `Release inventory untuk payout ref ${payout.ref}`,
          },
        ]
      : []),
  ];

  await upsertJournalEntryReplacingLines(tx, {
    referenceType: PAYOUT_JOURNAL_REFERENCE_TYPE,
    referenceId: payoutSettlementReferenceId(payoutId),
    transactionDate: payout.payout_date,
    description: `Penerimaan payout ${channel.channel_name} ref ${payout.ref}`,
    lines,
  });
}

async function cleanupCurrentTransactions() {
  await prisma.$transaction(async (tx) => {
    const saleMovementInvCodes = await tx.stock_movements.findMany({
      where: {
        reference_type: "SALE",
      },
      select: {
        inv_code: true,
      },
      distinct: ["inv_code"],
    });

    await tx.journal_entries.deleteMany({
      where: {
        reference_type: {
          in: [
            PAYOUT_JOURNAL_REFERENCE_TYPE,
            PAYOUT_ADJUSTMENT_JOURNAL_REFERENCE_TYPE,
            PAYOUT_TRANSFER_JOURNAL_REFERENCE_TYPE,
          ],
        },
      },
    });

    await tx.stock_movements.deleteMany({
      where: {
        reference_type: "SALE",
      },
    });

    await tx.payout_transfers.deleteMany({});
    await tx.t_adjustments.deleteMany({});
    await tx.t_payout.deleteMany({});
    await tx.t_order_item.deleteMany({});
    await tx.t_order.deleteMany({});

    for (const row of saleMovementInvCodes) {
      await recalculateBalance(tx, row.inv_code);
    }
  });
}

async function selectCandidates() {
  const payouts = parseCsv("data/data-tes-real/Payout.csv");
  const orders = parseCsv("data/data-tes-real/sales - order (4).csv");
  const orderItems = parseCsv("data/data-tes-real/Sales - order_item (4).csv");

  const orderByRef = new Map(orders.filter((row) => row.ref_no).map((row) => [row.ref_no, row]));
  const itemsByOrder = new Map();

  for (const item of orderItems) {
    if (!itemsByOrder.has(item.order_no)) {
      itemsByOrder.set(item.order_no, []);
    }
    itemsByOrder.get(item.order_no).push(item);
  }

  const rawCandidates = TARGET_REFS.map((ref) => {
    const payout = payouts.find((row) => row.ref === ref);
    const order = orderByRef.get(ref);
    const items = order ? itemsByOrder.get(order.order_no) ?? [] : [];

    return {
      ref,
      payout,
      order,
      items,
    };
  });

  assert(rawCandidates.every((candidate) => candidate.payout && candidate.order), "Ada ref target yang tidak match antara sales dan payout CSV.");
  assert(rawCandidates.every((candidate) => candidate.items.length > 0), "Ada order target yang belum punya item di CSV item.");

  const skuSet = [...new Set(rawCandidates.flatMap((candidate) => candidate.items.map((item) => item.sku)).filter(Boolean))];

  const products = await prisma.master_product.findMany({
    where: {
      sku: { in: skuSet },
    },
    select: {
      sku: true,
      product_name: true,
      is_active: true,
      total_hpp: true,
      product_bom: {
        where: {
          is_active: true,
          is_stock_tracked: true,
          inv_code: { not: null },
        },
        orderBy: [{ sequence_no: "asc" }, { id: "asc" }],
        select: {
          id: true,
          inv_code: true,
          qty: true,
          component_name: true,
        },
      },
    },
  });

  const productBySku = new Map(products.map((product) => [product.sku, product]));

  return rawCandidates.map((candidate) => {
    const enrichedItems = candidate.items.map((item) => {
      const product = productBySku.get(item.sku);
      assert(product?.is_active, `SKU ${item.sku} tidak aktif atau tidak ditemukan.`);
      assert(product.product_bom.length > 0, `SKU ${item.sku} belum punya BOM stock-tracked aktif.`);

      return {
        ...item,
        product,
      };
    });

    return {
      ref: candidate.ref,
      payout: candidate.payout,
      order: candidate.order,
      items: enrichedItems,
    };
  });
}

async function topUpStockForCandidates(candidates) {
  const requirements = new Map();

  for (const candidate of candidates) {
    for (const item of candidate.items) {
      for (const bom of item.product.product_bom) {
        if (!bom.inv_code) continue;
        const neededQty = Math.round(Number(bom.qty) * Number(item.qty));
        requirements.set(bom.inv_code, (requirements.get(bom.inv_code) ?? 0) + neededQty);
      }
    }
  }

  const invCodes = [...requirements.keys()];
  const balances = await prisma.stock_balances.findMany({
    where: {
      inv_code: { in: invCodes },
    },
    select: {
      inv_code: true,
      qty_on_hand: true,
    },
  });

  const currentBalanceByInvCode = new Map(balances.map((row) => [row.inv_code, row.qty_on_hand]));
  const createdAdjustments = [];

  await prisma.$transaction(async (tx) => {
    for (const invCode of invCodes) {
      const required = requirements.get(invCode) ?? 0;
      const onHand = currentBalanceByInvCode.get(invCode) ?? 0;
      const shortage = Math.max(0, required - onHand);

      if (shortage <= 0) {
        continue;
      }

      const created = await createPostedAdjustment(tx, {
        invCode,
        qty: shortage,
        adjustmentDate: new Date("2025-12-01T00:00:00.000Z"),
        notes: `Top-up stok untuk import tes payout real (${invCode})`,
      });

      createdAdjustments.push({
        adjustment_id: created.id,
        inv_code: invCode,
        qty: shortage,
      });
    }
  });

  return createdAdjustments;
}

async function importCandidates(candidates) {
  const imported = [];

  for (const candidate of candidates) {
    const importedCandidate = await prisma.$transaction(async (tx) => {
      const item = candidate.items[0];
      assert(item, `Order ${candidate.order.order_no} belum punya item.`);

      const orderTotal = candidate.items
        .reduce(
          (sum, orderItem) =>
            sum + Number(orderItem.qty) * asMoney(orderItem.unit_price),
          0
        )
        .toFixed(2);

      const createdOrder = await tx.t_order.create({
        data: {
          order_no: candidate.order.order_no,
          order_date: asDateTime(candidate.order.order_date),
          ref_no: candidate.order.ref_no,
          parent_order_no: null,
          channel_id: Number(candidate.order.channel_id),
          customer_id: null,
          total_amount: orderTotal,
          status: "PAID",
          is_historical: false,
        },
      });

      const createdItem = await tx.t_order_item.create({
        data: {
          order_no: createdOrder.order_no,
          sku: item.sku,
          qty: Number(item.qty),
          unit_price: asMoney(item.unit_price).toFixed(2),
          discount_item: asMoney(item.discount_item).toFixed(2),
        },
      });

      await syncSalesOrderItemMovementAndJournal(tx, createdItem.id);

      const createdPayout = await tx.t_payout.create({
        data: {
          ref: candidate.payout.ref,
          payout_date: asDateOnly(candidate.payout.payout_date),
          qty_produk: Number(candidate.payout.qty_produk),
          hpp: asMoney(candidate.payout.hpp).toFixed(2),
          total_price: asMoney(candidate.payout.total_price).toFixed(2),
          seller_discount: asPositiveMoney(candidate.payout.seller_discount).toFixed(2),
          fee_admin: asPositiveMoney(candidate.payout.fee_admin).toFixed(2),
          fee_service: asPositiveMoney(candidate.payout.fee_service).toFixed(2),
          fee_order_process: asPositiveMoney(candidate.payout.fee_order_process).toFixed(2),
          fee_program: asPositiveMoney(candidate.payout.fee_program).toFixed(2),
          fee_transaction: asPositiveMoney(candidate.payout.fee_transaction).toFixed(2),
          fee_affiliate: asPositiveMoney(candidate.payout.fee_affiliate).toFixed(2),
          shipping_cost: asPositiveMoney(candidate.payout.shipping_cost).toFixed(2),
          omset: asMoney(candidate.payout.omset).toFixed(2),
          payout_status: "SETTLED",
        },
      });

      await syncPayoutSettlementJournal(tx, createdPayout.payout_id);

      const payoutJournal = await tx.journal_entries.findFirst({
        where: {
          reference_type: PAYOUT_JOURNAL_REFERENCE_TYPE,
          reference_id: payoutSettlementReferenceId(createdPayout.payout_id),
        },
        include: {
          journal_lines: true,
        },
      });

      const stockMovements = await tx.stock_movements.findMany({
        where: {
          reference_type: "SALE",
          reference_id: String(createdItem.id),
        },
      });

      return {
        ref: candidate.ref,
        order_no: createdOrder.order_no,
        payout_id: createdPayout.payout_id,
        sku: item.sku,
        qty: Number(item.qty),
        total_amount: orderTotal,
        payout_omset: asMoney(candidate.payout.omset).toFixed(2),
        payout_journal_lines: payoutJournal?.journal_lines.length ?? 0,
        stock_movement_count: stockMovements.length,
      };
    });

    imported.push(importedCandidate);
  }

  return imported;
}

async function loadFinalSnapshot(candidates) {
  const refs = candidates.map((candidate) => candidate.ref);
  const orders = await prisma.t_order.findMany({
    where: {
      ref_no: { in: refs },
    },
    orderBy: [{ order_date: "asc" }, { order_no: "asc" }],
    include: {
      t_order_item: true,
      m_channel: {
        select: {
          channel_name: true,
        },
      },
    },
  });

  const payouts = await prisma.t_payout.findMany({
    where: {
      ref: { in: refs },
    },
    orderBy: [{ payout_date: "asc" }, { payout_id: "asc" }],
  });

  const stockInvCodes = [
    ...new Set(
      candidates.flatMap((candidate) =>
        candidate.items.flatMap((item) =>
          item.product.product_bom.map((bom) => bom.inv_code).filter(Boolean)
        )
      )
    ),
  ];

  const stockBalances = await prisma.stock_balances.findMany({
    where: {
      inv_code: { in: stockInvCodes },
    },
  });

  const journalSummary = await prisma.journal_entries.groupBy({
    by: ["reference_type"],
    where: {
      reference_type: {
        in: [PAYOUT_JOURNAL_REFERENCE_TYPE],
      },
    },
    _count: {
      _all: true,
    },
  });

  return {
    orders: orders.map((order) => ({
      order_no: order.order_no,
      ref_no: order.ref_no,
      channel: order.m_channel?.channel_name ?? "-",
      total_amount: order.total_amount.toString(),
      item_count: order.t_order_item.length,
    })),
    payouts: payouts.map((payout) => ({
      payout_id: payout.payout_id,
      ref: payout.ref,
      total_price: payout.total_price.toString(),
      omset: payout.omset.toString(),
      payout_status: payout.payout_status,
    })),
    journal_summary: journalSummary.map((row) => ({
      reference_type: row.reference_type,
      count: row._count._all,
    })),
    stock_balances: stockBalances.map((row) => ({
      inv_code: row.inv_code,
      qty_on_hand: row.qty_on_hand,
    })),
  };
}

async function main() {
  try {
    const candidates = await selectCandidates();
    await cleanupCurrentTransactions();
    const stockAdjustments = await topUpStockForCandidates(candidates);
    const imported = await importCandidates(candidates);
    const snapshot = await loadFinalSnapshot(candidates);

    console.log(
      JSON.stringify(
        {
          ok: true,
          selected_refs: candidates.map((candidate) => candidate.ref),
          stock_adjustments: stockAdjustments,
          imported,
          snapshot,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
