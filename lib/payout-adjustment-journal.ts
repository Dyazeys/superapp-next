import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";

type Tx = Prisma.TransactionClient;

const PAYOUT_ADJUSTMENT_JOURNAL_REFERENCE_TYPE = "PAYOUT_ADJUSTMENT";
const PAYOUT_ADJUSTMENT_JOURNAL_NAMESPACE = "superapp:payout-adjustment:v1";

export function payoutAdjustmentReferenceId(adjustmentId: number) {
  const hash = createHash("sha1")
    .update(`${PAYOUT_ADJUSTMENT_JOURNAL_NAMESPACE}:${adjustmentId}`)
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

async function upsertPayoutAdjustmentJournal(
  tx: Tx,
  params: {
    referenceId: string;
    transactionDate: Date;
    description: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      memo: string;
    }>;
  }
) {
  await upsertJournalEntryReplacingLines(tx, {
    referenceType: PAYOUT_ADJUSTMENT_JOURNAL_REFERENCE_TYPE,
    referenceId: params.referenceId,
    transactionDate: params.transactionDate,
    description: params.description,
    lines: params.lines.map((line) => ({
      accountId: line.accountId,
      debit: line.debit.toFixed(2),
      credit: line.credit.toFixed(2),
      memo: line.memo,
    })),
  });
}

export async function syncPayoutAdjustmentJournal(tx: Tx, adjustmentId: number) {
  const referenceId = payoutAdjustmentReferenceId(adjustmentId);

  const adjustment = await tx.t_adjustments.findUnique({
    where: { adjustment_id: adjustmentId },
    select: {
      adjustment_id: true,
      ref: true,
      payout_date: true,
      adjustment_date: true,
      amount: true,
      adjustment_type: true,
      reason: true,
      channel_id: true,
      t_order: {
        select: {
          channel_id: true,
        },
      },
    },
  });

  if (!adjustment) {
    return;
  }

  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_ADJUSTMENT_JOURNAL_REFERENCE_TYPE,
      reference_id: referenceId,
    },
    select: { id: true },
  });

  const amount = Number(adjustment.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  const channelId = adjustment.channel_id ?? adjustment.t_order?.channel_id ?? null;
  if (!channelId) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  const channel = await tx.m_channel.findUnique({
    where: { channel_id: channelId },
    select: {
      channel_name: true,
      piutang_account_id: true,
      saldo_account_id: true,
    },
  });

  invariant(channel, `Channel ${channelId} was not found for payout adjustment ${adjustmentId}.`);
  invariant(
    channel.piutang_account_id,
    `Piutang account mapping is missing for channel ${channel.channel_name} on payout adjustment ${adjustmentId}.`
  );
  invariant(
    channel.saldo_account_id,
    `Saldo account mapping is missing for channel ${channel.channel_name} on payout adjustment ${adjustmentId}.`
  );

  const transactionDate = adjustment.adjustment_date ?? adjustment.payout_date;

  await upsertPayoutAdjustmentJournal(tx, {
    referenceId,
    transactionDate,
    description:
      `Adjustment payout ${channel.channel_name}` +
      ` ref ${adjustment.ref ?? "-"} ` +
      `(${adjustment.adjustment_type ?? "-"})` +
      `${adjustment.reason ? ` - ${adjustment.reason}` : ""}`,
    lines: [
      {
        accountId: channel.saldo_account_id,
        debit: amount,
        credit: 0,
        memo: `Saldo channel bertambah dari adjustment payout ${adjustment.ref ?? adjustment.adjustment_id}`,
      },
      {
        accountId: channel.piutang_account_id,
        debit: 0,
        credit: amount,
        memo: `Piutang channel disesuaikan untuk adjustment payout ${adjustment.ref ?? adjustment.adjustment_id}`,
      },
    ],
  });
}

export async function deletePayoutAdjustmentJournal(tx: Tx, adjustmentId: number) {
  const referenceId = payoutAdjustmentReferenceId(adjustmentId);
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_ADJUSTMENT_JOURNAL_REFERENCE_TYPE,
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
