import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";

type Tx = Prisma.TransactionClient;

const OPERATIONAL_EXPENSE_BARTER_REFERENCE_TYPE = "OPERATIONAL_EXPENSE_BARTER";
const OPERATIONAL_EXPENSE_BARTER_JOURNAL_NAMESPACE = "superapp:journal:operational-expense-barter:v1";
const DEFAULT_INVENTORY_ACCOUNT_CODE = "13101";

export function operationalExpenseBarterReferenceId(barterId: string) {
  const hash = createHash("sha1")
    .update(`${OPERATIONAL_EXPENSE_BARTER_JOURNAL_NAMESPACE}:${barterId}`)
    .digest("hex")
    .slice(0, 32);
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

export async function recalculateOperationalExpenseBarterTotal(tx: Tx, barterId: string) {
  const items = await tx.operational_expense_barter_items.findMany({
    where: { barter_id: barterId },
    select: { line_amount: true },
  });

  const totalAmount = items.reduce((sum, item) => sum + Number(item.line_amount ?? 0), 0);

  await tx.operational_expense_barter.update({
    where: { id: barterId },
    data: {
      total_amount: totalAmount.toFixed(2),
      updated_at: new Date(),
    },
  });

  return totalAmount;
}

export async function syncOperationalExpenseBarterJournal(tx: Tx, barterId: string) {
  const barter = await tx.operational_expense_barter.findUnique({
    where: { id: barterId },
    include: {
      accounts_operational_expense_barter_expense_account_idToaccounts: {
        select: {
          code: true,
          name: true,
        },
      },
      operational_expense_barter_items: {
        select: {
          id: true,
        },
      },
    },
  });

  const referenceId = operationalExpenseBarterReferenceId(barterId);
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: OPERATIONAL_EXPENSE_BARTER_REFERENCE_TYPE,
      reference_id: referenceId,
    },
    select: { id: true },
  });

  if (!barter || barter.status !== "POSTED" || barter.operational_expense_barter_items.length === 0) {
    if (existing) {
      await tx.journal_entries.delete({
        where: { id: existing.id },
      });
    }
    return;
  }

  const totalAmount = Number(barter.total_amount);
  invariant(Number.isFinite(totalAmount) && totalAmount > 0, `Operational expense barter ${barterId} must have a positive total.`);

  const expenseAccount = barter.accounts_operational_expense_barter_expense_account_idToaccounts;
  invariant(expenseAccount, `Expense account mapping is missing for operational expense barter ${barterId}.`);

  const inventoryAccount = await tx.accounts.findUnique({
    where: { code: DEFAULT_INVENTORY_ACCOUNT_CODE },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });
  invariant(
    inventoryAccount,
    `Default inventory account ${DEFAULT_INVENTORY_ACCOUNT_CODE} was not found for operational expense barter ${barterId}.`
  );

  const labelSuffix = barter.expense_label ? ` / ${barter.expense_label}` : "";

  await upsertJournalEntryReplacingLines(tx, {
    referenceType: OPERATIONAL_EXPENSE_BARTER_REFERENCE_TYPE,
    referenceId,
    transactionDate: barter.barter_date,
    description: `Opex barter ${expenseAccount.name}${labelSuffix}${barter.description ? ` - ${barter.description}` : ""}`,
    lines: [
      {
        accountId: barter.expense_account_id,
        debit: totalAmount.toFixed(2),
        credit: "0.00",
        memo: `Beban opex barter ${expenseAccount.code}${labelSuffix}`,
      },
      {
        accountId: inventoryAccount.id,
        debit: "0.00",
        credit: totalAmount.toFixed(2),
        memo: `Persediaan keluar untuk opex barter ${barterId}`,
      },
    ],
  });
}
