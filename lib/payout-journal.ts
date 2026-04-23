import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";
import { isFailedPayoutStatus } from "@/lib/payout-status";

type Tx = Prisma.TransactionClient;

const PAYOUT_JOURNAL_REFERENCE_TYPE = "PAYOUT_SETTLEMENT";
const PAYOUT_JOURNAL_NAMESPACE = "superapp:payout-settlement:v1";
const HPP_ACCOUNT_CODE = "51101";
const INVENTORY_ACCOUNT_CODE = "13101";
const DEFAULT_REVENUE_ACCOUNT_CODE = "41106";

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
  await upsertJournalEntryReplacingLines(tx, {
    referenceType: PAYOUT_JOURNAL_REFERENCE_TYPE,
    referenceId: params.referenceId,
    transactionDate: params.payoutDate,
    description: params.description,
    lines: params.lines.map((line) => ({
      accountId: line.accountId,
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

  if (!payout) return;

  const existing = await tx.journal_entries.findFirst({
    where: {
      reference_type: PAYOUT_JOURNAL_REFERENCE_TYPE,
      reference_id: referenceId,
    },
    select: { id: true },
  });

  if (isFailedPayoutStatus(payout.payout_status)) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

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

  const saldoAccountId = channel.saldo_account_id;
  const revenueAccountId =
    channel.revenue_account_id ?? (await findAccountIdByCode(tx, DEFAULT_REVENUE_ACCOUNT_CODE));
  invariant(
    revenueAccountId,
    `Revenue account mapping is missing for channel ${channel.channel_name}, and default ${DEFAULT_REVENUE_ACCOUNT_CODE} was not found.`
  );

  const amount = Number(payout.omset);
  const revenueAmount = Number(payout.total_price);
  const hppAmount = Number(payout.hpp);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(revenueAmount) || revenueAmount <= 0) {
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

  let hppAccountId: string | null = null;
  let inventoryAccountId: string | null = null;

  if (Number.isFinite(hppAmount) && hppAmount > 0) {
    [hppAccountId, inventoryAccountId] = await Promise.all([
      findAccountIdByCode(tx, HPP_ACCOUNT_CODE),
      findAccountIdByCode(tx, INVENTORY_ACCOUNT_CODE),
    ]);

    invariant(hppAccountId, `HPP account ${HPP_ACCOUNT_CODE} is missing for payout ref ${payout.ref}.`);
    invariant(
      inventoryAccountId,
      `Inventory account ${INVENTORY_ACCOUNT_CODE} is missing for payout ref ${payout.ref}.`
    );
  }

  const lines = [
    {
      accountId: saldoAccountId,
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
              accountId: saldoAccountId,
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

  await upsertPayoutSettlementJournal(tx, {
    referenceId,
    payoutDate: payout.payout_date,
    description: `Penerimaan payout ${channel.channel_name} ref ${payout.ref}`,
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
