import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";

type Tx = Prisma.TransactionClient;

const PAYOUT_JOURNAL_REFERENCE_TYPE = "PAYOUT_SETTLEMENT";
const PAYOUT_JOURNAL_NAMESPACE = "superapp:payout-settlement:v1";

export function payoutSettlementReferenceId(payoutId: number) {
  const hash = createHash("sha1").update(`${PAYOUT_JOURNAL_NAMESPACE}:${payoutId}`).digest("hex").slice(0, 32);
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

async function upsertPayoutSettlementJournal(
  tx: Tx,
  params: {
    referenceId: string;
    payoutDate: Date;
    amount: number;
    piutangAccountId: string;
    saldoAccountId: string;
    description: string;
  }
) {
  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_JOURNAL_REFERENCE_TYPE,
      reference_id: params.referenceId,
    },
    select: { id: true },
  });

  if (!existing) {
    await tx.journal_entries.create({
      data: {
        transaction_date: params.payoutDate,
        reference_type: PAYOUT_JOURNAL_REFERENCE_TYPE,
        reference_id: params.referenceId,
        description: params.description,
        journal_lines: {
          create: [
            {
              account_id: params.saldoAccountId,
              debit: params.amount.toFixed(2),
              credit: "0.00",
              memo: "Payout settlement debit saldo channel",
            },
            {
              account_id: params.piutangAccountId,
              debit: "0.00",
              credit: params.amount.toFixed(2),
              memo: "Payout settlement credit piutang channel",
            },
          ],
        },
      },
    });
    return;
  }

  await tx.journal_entries.update({
    where: { id: existing.id },
    data: {
      transaction_date: params.payoutDate,
      description: params.description,
      updated_at: new Date(),
    },
  });

  await tx.journal_lines.deleteMany({
    where: { journal_entry_id: existing.id },
  });

  await tx.journal_lines.createMany({
    data: [
      {
        journal_entry_id: existing.id,
        account_id: params.saldoAccountId,
        debit: params.amount.toFixed(2),
        credit: "0.00",
        memo: "Payout settlement debit saldo channel",
      },
      {
        journal_entry_id: existing.id,
        account_id: params.piutangAccountId,
        debit: "0.00",
        credit: params.amount.toFixed(2),
        memo: "Payout settlement credit piutang channel",
      },
    ],
  });
}

export async function syncPayoutSettlementJournal(tx: Tx, payoutId: number) {
  const referenceId = payoutSettlementReferenceId(payoutId);

  const payout = await tx.t_payout.findUnique({
    where: { payout_id: payoutId },
    select: {
      payout_id: true,
      payout_date: true,
      ref: true,
      omset: true,
    },
  });

  if (!payout) return;

  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_JOURNAL_REFERENCE_TYPE,
      reference_id: referenceId,
    },
    select: { id: true },
  });

  if (!payout.ref) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  const order = await tx.t_order.findFirst({
    where: { ref_no: payout.ref },
    select: {
      channel_id: true,
    },
  });

  if (!order?.channel_id) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  const channel = await tx.m_channel.findUnique({
    where: { channel_id: order.channel_id },
    select: {
      channel_name: true,
      piutang_account_id: true,
      saldo_account_id: true,
    },
  });
  if (!channel?.saldo_account_id) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  invariant(channel.piutang_account_id, `Piutang account mapping is missing for channel ${channel.channel_name}.`);

  const amount = Number(payout.omset);
  if (!Number.isFinite(amount) || amount <= 0) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  await upsertPayoutSettlementJournal(tx, {
    referenceId,
    payoutDate: payout.payout_date,
    amount,
    piutangAccountId: channel.piutang_account_id,
    saldoAccountId: channel.saldo_account_id,
    description: `PAYOUT settlement posting for payout ${payout.payout_id} ref ${payout.ref} channel ${channel.channel_name}`,
  });
}

export async function deletePayoutSettlementJournal(tx: Tx, payoutId: number) {
  const referenceId = payoutSettlementReferenceId(payoutId);

  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_JOURNAL_REFERENCE_TYPE,
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
