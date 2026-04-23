import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";

type Tx = Prisma.TransactionClient;

const SALES_ORDER_ITEM_JOURNAL_REFERENCE_TYPE = "SALES_ORDER_ITEM";
const SALES_ORDER_ITEM_JOURNAL_NAMESPACE = "superapp:journal:sales-order-item:v1";
const HPP_ACCOUNT_CODE = "51101";
const INVENTORY_ACCOUNT_CODE = "13101";
const DEFAULT_REVENUE_ACCOUNT_CODE = "41106";

function deterministicSalesOrderItemReferenceId(orderItemId: number) {
  const hash = createHash("sha1").update(`${SALES_ORDER_ITEM_JOURNAL_NAMESPACE}:${orderItemId}`).digest("hex").slice(0, 32);
  const chars = hash.split("");

  chars[12] = "5";
  const variant = parseInt(chars[16], 16);
  chars[16] = ((variant & 0x3) | 0x8).toString(16);

  return [
    chars.slice(0, 8).join(""),
    chars.slice(8, 12).join(""),
    chars.slice(12, 16).join(""),
    chars.slice(16, 20).join(""),
    chars.slice(20, 32).join(""),
  ].join("-");
}

async function findAccountIdByCode(tx: Tx, code: string) {
  const account = await tx.accounts.findFirst({
    where: { code },
    select: { id: true },
  });

  return account?.id ?? null;
}

async function deleteSalesOrderItemJournalByReferenceId(tx: Tx, referenceId: string) {
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: SALES_ORDER_ITEM_JOURNAL_REFERENCE_TYPE,
      reference_id: referenceId,
    },
    select: { id: true },
  });

  if (!existing) {
    return;
  }

  await tx.journal_entries.delete({
    where: { id: existing.id },
  });
}

export async function syncSalesOrderItemJournal(tx: Tx, orderItemId: number) {
  const referenceId = deterministicSalesOrderItemReferenceId(orderItemId);

  const item = await tx.t_order_item.findUnique({
    where: { id: orderItemId },
    include: {
      master_product: {
        select: {
          total_hpp: true,
        },
      },
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
    },
  });

  if (!item || !item.t_order || item.t_order.is_historical || !item.order_no || !item.sku) {
    await deleteSalesOrderItemJournalByReferenceId(tx, referenceId);
    return;
  }

  const channel = item.t_order.m_channel;
  if (!channel?.piutang_account_id) {
    await deleteSalesOrderItemJournalByReferenceId(tx, referenceId);
    return;
  }

  const revenueAccountId = channel.revenue_account_id ?? (await findAccountIdByCode(tx, DEFAULT_REVENUE_ACCOUNT_CODE));
  if (!revenueAccountId) {
    await deleteSalesOrderItemJournalByReferenceId(tx, referenceId);
    return;
  }

  const revenueAmount = Math.max(0, item.qty * Number(item.unit_price));

  const productHpp = Number(item.master_product?.total_hpp ?? "0");
  const hppAmount = (Number.isFinite(productHpp) ? productHpp : 0) * item.qty;
  const needsHppPosting = hppAmount > 0;

  if (revenueAmount <= 0 && !needsHppPosting) {
    await deleteSalesOrderItemJournalByReferenceId(tx, referenceId);
    return;
  }

  let hppAccountId: string | null = null;
  let inventoryAccountId: string | null = null;

  if (needsHppPosting) {
    [hppAccountId, inventoryAccountId] = await Promise.all([
      findAccountIdByCode(tx, HPP_ACCOUNT_CODE),
      findAccountIdByCode(tx, INVENTORY_ACCOUNT_CODE),
    ]);

    if (!hppAccountId || !inventoryAccountId) {
      await deleteSalesOrderItemJournalByReferenceId(tx, referenceId);
      return;
    }
  }

  const description = `SALES posting for order ${item.order_no} item ${item.id} sku ${item.sku}${item.t_order.ref_no ? ` ref ${item.t_order.ref_no}` : ""}`;
  const lines: Array<{
    accountId: string;
    debit: string;
    credit: string;
    memo: string;
  }> = [];

  if (revenueAmount > 0) {
    lines.push(
      {
        accountId: channel.piutang_account_id,
        debit: revenueAmount.toFixed(2),
        credit: "0.00",
        memo: `Sales receivable for order ${item.order_no} item ${item.id}`,
      },
      {
        accountId: revenueAccountId,
        debit: "0.00",
        credit: revenueAmount.toFixed(2),
        memo: `Sales revenue for order ${item.order_no} item ${item.id}`,
      }
    );
  }

  if (needsHppPosting && hppAccountId && inventoryAccountId) {
    lines.push(
      {
        accountId: hppAccountId,
        debit: hppAmount.toFixed(2),
        credit: "0.00",
        memo: `HPP for order ${item.order_no} item ${item.id}`,
      },
      {
        accountId: inventoryAccountId,
        debit: "0.00",
        credit: hppAmount.toFixed(2),
        memo: `Inventory release for order ${item.order_no} item ${item.id}`,
      }
    );
  }

  await upsertJournalEntryReplacingLines(tx, {
    referenceType: SALES_ORDER_ITEM_JOURNAL_REFERENCE_TYPE,
    referenceId,
    transactionDate: item.t_order.order_date,
    description,
    lines: lines.map((line) => ({
      accountId: line.accountId,
      debit: line.debit,
      credit: line.credit,
      memo: line.memo,
    })),
  });
}

export async function deleteSalesOrderItemJournal(tx: Tx, orderItemId: number) {
  await deleteSalesOrderItemJournalByReferenceId(tx, deterministicSalesOrderItemReferenceId(orderItemId));
}

export async function syncSalesOrderJournals(tx: Tx, orderNo: string) {
  const items = await tx.t_order_item.findMany({
    where: { order_no: orderNo },
    select: { id: true },
  });

  for (const item of items) {
    await syncSalesOrderItemJournal(tx, item.id);
  }
}
