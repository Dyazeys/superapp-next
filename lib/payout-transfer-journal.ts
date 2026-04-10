import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";

type Tx = Prisma.TransactionClient;

const PAYOUT_TRANSFER_JOURNAL_REFERENCE_TYPE = "PAYOUT_BANK_TRANSFER";

async function upsertPayoutTransferJournal(
  tx: Tx,
  params: {
    referenceId: string;
    transferDate: Date;
    description: string;
    bankAccountId: string;
    saldoAccountId: string;
    amount: number;
  }
) {
  await upsertJournalEntryReplacingLines(tx, {
    referenceType: PAYOUT_TRANSFER_JOURNAL_REFERENCE_TYPE,
    referenceId: params.referenceId,
    transactionDate: params.transferDate,
    description: params.description,
    lines: [
      {
        accountId: params.bankAccountId,
        debit: params.amount.toFixed(2),
        credit: "0.00",
        memo: "Payout transfer debit bank account",
      },
      {
        accountId: params.saldoAccountId,
        debit: "0.00",
        credit: params.amount.toFixed(2),
        memo: "Payout transfer credit saldo channel",
      },
    ],
  });
}

export async function syncPayoutTransferJournal(tx: Tx, transferId: string) {
  const transfer = await tx.payout_transfers.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      payout_id: true,
      transfer_date: true,
      amount: true,
      bank_account_id: true,
      notes: true,
      accounts: {
        select: {
          code: true,
          name: true,
        },
      },
      t_payout: {
        select: {
          payout_id: true,
          ref: true,
          t_order: {
            select: {
              channel_id: true,
              m_channel: {
                select: {
                  channel_name: true,
                  saldo_account_id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!transfer) {
    return;
  }

  const amount = Number(transfer.amount);
  invariant(Number.isFinite(amount) && amount > 0, `Transfer amount must be positive for payout transfer ${transfer.id}.`);

  const channel = transfer.t_payout?.t_order?.m_channel;
  invariant(channel?.saldo_account_id, `Saldo account mapping is missing for payout transfer ${transfer.id}.`);

  await upsertPayoutTransferJournal(tx, {
    referenceId: transfer.id,
    transferDate: transfer.transfer_date,
    amount,
    bankAccountId: transfer.bank_account_id,
    saldoAccountId: channel.saldo_account_id,
    description: `PAYOUT bank transfer for payout ${transfer.payout_id} ref ${transfer.t_payout?.ref ?? "-"} channel ${channel.channel_name} to bank ${transfer.accounts.code}${transfer.notes ? ` note ${transfer.notes}` : ""}`,
  });
}

export async function deletePayoutTransferJournal(tx: Tx, transferId: string) {
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_TRANSFER_JOURNAL_REFERENCE_TYPE,
      reference_id: transferId,
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
