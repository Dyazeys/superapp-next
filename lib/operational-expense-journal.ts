import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";

type Tx = Prisma.TransactionClient;

const OPERATIONAL_EXPENSE_JOURNAL_REFERENCE_TYPE = "OPERATIONAL_EXPENSE";
const OPERATIONAL_EXPENSE_JOURNAL_NAMESPACE = "superapp:journal:operational-expense:v1";
const DEFAULT_INVENTORY_ACCOUNT_CODE = "13101";

export function operationalExpenseReferenceId(expenseId: string) {
  const hash = createHash("sha1")
    .update(`${OPERATIONAL_EXPENSE_JOURNAL_NAMESPACE}:${expenseId}`)
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

async function upsertOperationalExpenseJournal(
  tx: Tx,
  params: {
    referenceId: string;
    expenseDate: Date;
    description: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      memo: string;
    }>;
    createdBy?: string;
  }
) {
  await upsertJournalEntryReplacingLines(tx, {
    referenceType: OPERATIONAL_EXPENSE_JOURNAL_REFERENCE_TYPE,
    referenceId: params.referenceId,
    transactionDate: params.expenseDate,
    description: params.description,
    lines: params.lines.map((line) => ({
      accountId: line.accountId,
      debit: line.debit.toFixed(2),
      credit: line.credit.toFixed(2),
      memo: line.memo,
    })),
    createdBy: params.createdBy,
  });
}

export async function syncOperationalExpenseJournal(tx: Tx, expenseId: string, createdBy?: string) {
  const expense = await tx.operational_expenses.findUnique({
    where: { id: expenseId },
    include: {
      accounts_operational_expenses_expense_account_idToaccounts: {
        select: {
          code: true,
          name: true,
        },
      },
      accounts_operational_expenses_payment_account_idToaccounts: {
        select: {
          code: true,
          name: true,
        },
      },
      master_inventory: {
        select: {
          inv_code: true,
          inv_name: true,
        },
      },
    },
  });

  if (!expense) {
    return;
  }

  const referenceId = operationalExpenseReferenceId(expense.id);
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: OPERATIONAL_EXPENSE_JOURNAL_REFERENCE_TYPE,
      reference_id: referenceId,
    },
    select: { id: true },
  });

  if (expense.status !== "POSTED") {
    if (existing) {
      await tx.journal_entries.delete({
        where: { id: existing.id },
      });
    }
    return;
  }

  const amount = Number(expense.amount);
  invariant(Number.isFinite(amount) && amount > 0, `Operational expense ${expenseId} must have a positive amount.`);

  const expenseAccount = expense.accounts_operational_expenses_expense_account_idToaccounts;
  invariant(expenseAccount, `Expense account mapping is missing for operational expense ${expenseId}.`);
  const labelSuffix = expense.expense_label ? ` / ${expense.expense_label}` : "";

  if (expense.is_product_barter) {
    invariant(expense.inv_code, `Inventory code is required for product barter operational expense ${expenseId}.`);

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
      `Default inventory account ${DEFAULT_INVENTORY_ACCOUNT_CODE} was not found for operational expense ${expenseId}.`
    );

    await upsertOperationalExpenseJournal(tx, {
      referenceId,
      expenseDate: expense.expense_date,
      description:
        `Opex barter ${expenseAccount.name}${labelSuffix}` +
        `${expense.master_inventory ? ` / ${expense.master_inventory.inv_name}` : ""}` +
        `${expense.description ? ` - ${expense.description}` : ""}`,
      lines: [
        {
          accountId: expense.expense_account_id,
          debit: amount,
          credit: 0,
          memo: `Beban opex barter ${expenseAccount.code}${labelSuffix}`,
        },
        {
          accountId: inventoryAccount.id,
          debit: 0,
          credit: amount,
          memo: `Persediaan keluar untuk opex barter ${expense.master_inventory?.inv_code ?? expense.inv_code}`,
        },
      ],
      createdBy,
    });
    return;
  }

  invariant(expense.payment_account_id, `Payment account is required for operational expense ${expenseId}.`);
  const paymentAccount = expense.accounts_operational_expenses_payment_account_idToaccounts;
  invariant(paymentAccount, `Payment account mapping is missing for operational expense ${expenseId}.`);

  await upsertOperationalExpenseJournal(tx, {
    referenceId,
    expenseDate: expense.expense_date,
    description: `Opex ${expenseAccount.name}${labelSuffix}${expense.description ? ` - ${expense.description}` : ""}`,
    lines: [
      {
        accountId: expense.expense_account_id,
        debit: amount,
        credit: 0,
        memo: `Beban opex ${expenseAccount.code}${labelSuffix}`,
      },
      {
        accountId: expense.payment_account_id,
        debit: 0,
        credit: amount,
        memo: `Pembayaran opex via ${paymentAccount.code}`,
      },
    ],
    createdBy,
  });
}

export async function deleteOperationalExpenseJournal(tx: Tx, expenseId: string) {
  const referenceId = operationalExpenseReferenceId(expenseId);
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: OPERATIONAL_EXPENSE_JOURNAL_REFERENCE_TYPE,
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
