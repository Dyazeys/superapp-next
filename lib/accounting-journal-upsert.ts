import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

type JournalLineInput = {
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
};

type UpsertJournalParams = {
  referenceType: string;
  referenceId: string;
  transactionDate: Date;
  description: string;
  lines: JournalLineInput[];
};

export async function upsertJournalEntryReplacingLines(tx: Tx, params: UpsertJournalParams) {
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
        debit: line.debit,
        credit: line.credit,
        memo: line.memo,
      })),
    });
  }

  return journalEntryId;
}
