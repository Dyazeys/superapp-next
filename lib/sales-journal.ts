import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

const SALES_ORDER_ITEM_JOURNAL_REFERENCE_TYPE = "SALES_ORDER_ITEM";
const SALES_ORDER_ITEM_JOURNAL_NAMESPACE = "superapp:journal:sales-order-item:v1";

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
  await deleteSalesOrderItemJournalByReferenceId(tx, referenceId);
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
