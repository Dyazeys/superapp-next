import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";

type Tx = Prisma.TransactionClient;

const PAYOUT_JOURNAL_REFERENCE_TYPE = "PAYOUT_SETTLEMENT";
const PAYOUT_JOURNAL_NAMESPACE = "superapp:payout-settlement:v1";

const MARKETPLACE_FEE_ACCOUNT_CODE_BY_REVENUE_CODE: Record<string, string> = {
  "41101": "61107",
  "41102": "61108",
  "41103": "61109",
  "41104": "61110",
  "41105": "61111",
  "41106": "61112",
  "41107": "61113",
};

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
    description: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      memo: string;
    }>;
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
          create: params.lines.map((line) => ({
            account_id: line.accountId,
            debit: line.debit.toFixed(2),
            credit: line.credit.toFixed(2),
            memo: line.memo,
          })),
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
    data: params.lines.map((line) => ({
      journal_entry_id: existing.id,
      account_id: line.accountId,
      debit: line.debit.toFixed(2),
      credit: line.credit.toFixed(2),
      memo: line.memo,
    })),
  });
}

async function findAccountIdByCode(tx: Tx, code: string) {
  const account = await tx.accounts.findFirst({
    where: { code },
    select: { id: true },
  });

  return account?.id ?? null;
}

function marketplaceFeeAccountCodeForRevenueCode(revenueCode: string | null | undefined) {
  if (!revenueCode) {
    return null;
  }

  return MARKETPLACE_FEE_ACCOUNT_CODE_BY_REVENUE_CODE[revenueCode] ?? null;
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
      fee_admin: true,
      fee_service: true,
      fee_order_process: true,
      fee_program: true,
      fee_transaction: true,
      fee_affiliate: true,
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
      revenue_account_id: true,
      saldo_account_id: true,
      revenue_account: {
        select: {
          code: true,
        },
      },
    },
  });
  if (!channel?.saldo_account_id) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  invariant(channel.piutang_account_id, `Piutang account mapping is missing for channel ${channel.channel_name}.`);
  const saldoAccountId = channel.saldo_account_id;
  const piutangAccountId = channel.piutang_account_id;

  const amount = Number(payout.omset);
  if (!Number.isFinite(amount) || amount <= 0) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  const feeComponents = [
    { amount: Number(payout.fee_admin), label: "admin" },
    { amount: Number(payout.fee_service), label: "service" },
    { amount: Number(payout.fee_order_process), label: "order process" },
    { amount: Number(payout.fee_program), label: "program" },
    { amount: Number(payout.fee_transaction), label: "transaction" },
    { amount: Number(payout.fee_affiliate), label: "affiliate" },
  ].filter((component) => Number.isFinite(component.amount) && component.amount > 0);

  let feeExpenseAccountId: string | null = null;

  if (feeComponents.length > 0) {
    const feeExpenseAccountCode = marketplaceFeeAccountCodeForRevenueCode(channel.revenue_account?.code);
    invariant(
      feeExpenseAccountCode,
      `Marketplace fee expense mapping is missing for channel ${channel.channel_name}.`
    );

    feeExpenseAccountId = await findAccountIdByCode(tx, feeExpenseAccountCode);
    invariant(
      feeExpenseAccountId,
      `Marketplace fee expense account ${feeExpenseAccountCode} is missing for channel ${channel.channel_name}.`
    );
  }

  const lines = [
    {
      accountId: saldoAccountId,
      debit: amount,
      credit: 0,
      memo: "Payout settlement debit saldo channel",
    },
    {
      accountId: piutangAccountId,
      debit: 0,
      credit: amount,
      memo: "Payout settlement credit piutang channel",
    },
    ...feeComponents.flatMap((component) =>
      feeExpenseAccountId
        ? [
            {
              accountId: feeExpenseAccountId,
              debit: component.amount,
              credit: 0,
              memo: `Marketplace fee expense (${component.label}) for payout ${payout.payout_id}`,
            },
            {
              accountId: saldoAccountId,
              debit: 0,
              credit: component.amount,
              memo: `Marketplace fee deduction (${component.label}) from saldo for payout ${payout.payout_id}`,
            },
          ]
        : []
    ),
  ];

  await upsertPayoutSettlementJournal(tx, {
    referenceId,
    payoutDate: payout.payout_date,
    description: `PAYOUT settlement posting for payout ${payout.payout_id} ref ${payout.ref} channel ${channel.channel_name}`,
    lines,
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
