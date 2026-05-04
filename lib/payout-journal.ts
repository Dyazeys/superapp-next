import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";
import { upsertJournalEntryReplacingLines } from "@/lib/accounting-journal-upsert";
type Tx = Prisma.TransactionClient;

const PAYOUT_JOURNAL_REFERENCE_TYPE = "PAYOUT_SETTLEMENT";
const PAYOUT_JOURNAL_NAMESPACE = "superapp:payout-settlement:v1";
const HPP_ACCOUNT_CODE = "51101";
const INVENTORY_ACCOUNT_CODE = "13101";
const DEFAULT_REVENUE_ACCOUNT_CODE = "41106";
const SALES_DISCOUNT_ACCOUNT_CODE_BY_REVENUE_CODE: Record<string, string> = {
  "41101": "42104",
  "41102": "42105",
};
const DEFAULT_SALES_DISCOUNT_ACCOUNT_CODE = "42102";
const MARKETPLACE_FEE_ACCOUNT_CODE_BY_COMPONENT = {
  fee_admin: "61114",
  fee_service: "61115",
  fee_order_process: "61116",
  fee_program: "61117",
  fee_affiliate: "61118",
} as const;
type FeeComponentKey = keyof typeof MARKETPLACE_FEE_ACCOUNT_CODE_BY_COMPONENT;
type FeeComponent = {
  key: FeeComponentKey;
  amount: number;
  label: string;
};

type PayoutSettlementProfile = {
  settlementKey: string;
  settlementLabel: string;
  sellerDiscountAccountCode: string;
  shippingCostAccountCode: string | null;
  shippingCostLabel: string;
  feeLabels: Record<FeeComponentKey, string>;
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

function feeLabelsForChannel(channelName: string | null | undefined) {
  const normalized = String(channelName ?? "").trim().toLowerCase();
  const isShopee = normalized === "shopee";
  const isTokopediaTiktok = normalized === "tokopedia" || normalized === "tiktok";

  return {
    fee_admin: "Admin Fee",
    fee_service: isShopee ? "Biaya Layanan" : isTokopediaTiktok ? "Dynamic Commission" : "Service Fee",
    fee_order_process: isShopee
      ? "Biaya Proses Pesanan"
      : isTokopediaTiktok
        ? "Order Processing Fee"
        : "Order Process Fee",
    fee_program: isShopee
      ? "Biaya Program"
      : isTokopediaTiktok
        ? "Extra Voucher & Bonus Cashback Service Fee"
        : "Program Fee",
    fee_affiliate: "Affiliate Commission",
  } satisfies Record<FeeComponentKey, string>;
}

function payoutSettlementProfileForChannel(params: {
  channelName: string | null | undefined;
  slug: string | null | undefined;
  revenueCode: string | null | undefined;
}) {
  const normalizedName = String(params.channelName ?? "").trim().toLowerCase();
  const normalizedSlug = String(params.slug ?? "").trim().toLowerCase();

  if (normalizedName === "tokopedia" || normalizedName === "tiktok" || normalizedSlug === "tokopedia" || normalizedSlug === "tiktok") {
    return {
      settlementKey: "tokopedia-tiktokshop",
      settlementLabel: "Tokopedia-Tiktokshop",
      sellerDiscountAccountCode: "42105",
      shippingCostAccountCode: "61120",
      shippingCostLabel: "Shipping Cost",
      feeLabels: feeLabelsForChannel("tiktok"),
    } satisfies PayoutSettlementProfile;
  }

  if (normalizedName === "shopee" || normalizedSlug === "shopee") {
    return {
      settlementKey: "shopee",
      settlementLabel: "Shopee",
      sellerDiscountAccountCode: "42104",
      shippingCostAccountCode: "61119",
      shippingCostLabel: "Shipping Cost",
      feeLabels: feeLabelsForChannel("shopee"),
    } satisfies PayoutSettlementProfile;
  }

  const fallbackSellerDiscountAccountCode = params.revenueCode
    ? SALES_DISCOUNT_ACCOUNT_CODE_BY_REVENUE_CODE[params.revenueCode] ?? DEFAULT_SALES_DISCOUNT_ACCOUNT_CODE
    : DEFAULT_SALES_DISCOUNT_ACCOUNT_CODE;

  return {
    settlementKey: normalizedSlug || normalizedName || "default",
    settlementLabel: params.channelName ?? "Unknown",
    sellerDiscountAccountCode: fallbackSellerDiscountAccountCode,
    shippingCostAccountCode: null,
    shippingCostLabel: "Shipping Cost",
    feeLabels: feeLabelsForChannel(params.channelName),
  } satisfies PayoutSettlementProfile;
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
      seller_discount: true,
      fee_admin: true,
      fee_service: true,
      fee_order_process: true,
      fee_program: true,
      fee_affiliate: true,
      shipping_cost: true,
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
      slug: true,
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
  const settlementProfile = payoutSettlementProfileForChannel({
    channelName: channel.channel_name,
    slug: channel.slug,
    revenueCode: channel.revenue_account?.code,
  });

  const amount = Number(payout.omset);
  const revenueAmount = Number(payout.total_price);
  const hppAmount = Number(payout.hpp);
  const sellerDiscountAmount = Number(payout.seller_discount);
  const shippingCostAmount = Number(payout.shipping_cost);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(revenueAmount) || revenueAmount <= 0) {
    if (existing) {
      await tx.journal_entries.delete({ where: { id: existing.id } });
    }
    return;
  }

  const feeComponents = [
    { key: "fee_admin", amount: Number(payout.fee_admin), label: settlementProfile.feeLabels.fee_admin },
    { key: "fee_service", amount: Number(payout.fee_service), label: settlementProfile.feeLabels.fee_service },
    {
      key: "fee_order_process",
      amount: Number(payout.fee_order_process),
      label: settlementProfile.feeLabels.fee_order_process,
    },
    { key: "fee_program", amount: Number(payout.fee_program), label: settlementProfile.feeLabels.fee_program },
    { key: "fee_affiliate", amount: Number(payout.fee_affiliate), label: settlementProfile.feeLabels.fee_affiliate },
  ] satisfies FeeComponent[];
  const activeFeeComponents = feeComponents.filter((component) => Number.isFinite(component.amount) && component.amount > 0);

  const feeExpenseAccountIdByComponent: Partial<Record<FeeComponentKey, string>> = {};
  let salesDiscountAccountId: string | null = null;
  let shippingCostAccountId: string | null = null;

  if (Number.isFinite(sellerDiscountAmount) && sellerDiscountAmount > 0) {
    const salesDiscountAccountCode = settlementProfile.sellerDiscountAccountCode;
    salesDiscountAccountId = await findAccountIdByCode(tx, salesDiscountAccountCode);
    invariant(
      salesDiscountAccountId,
      `Sales discount account ${salesDiscountAccountCode} is missing for payout ref ${payout.ref}.`
    );
  }

  if (activeFeeComponents.length > 0) {
    for (const component of activeFeeComponents) {
      const feeExpenseAccountCode = MARKETPLACE_FEE_ACCOUNT_CODE_BY_COMPONENT[component.key];
      const feeExpenseAccountId = await findAccountIdByCode(tx, feeExpenseAccountCode);
      invariant(
        feeExpenseAccountId,
        `Marketplace fee expense account ${feeExpenseAccountCode} is missing for channel ${channel.channel_name}.`
      );
      feeExpenseAccountIdByComponent[component.key] = feeExpenseAccountId;
    }
  }

  if (Number.isFinite(shippingCostAmount) && shippingCostAmount > 0) {
    invariant(
      settlementProfile.shippingCostAccountCode,
      `Shipping cost account mapping is missing for settlement ${settlementProfile.settlementLabel}.`
    );
    shippingCostAccountId = await findAccountIdByCode(tx, settlementProfile.shippingCostAccountCode);
    invariant(
      shippingCostAccountId,
      `Shipping cost account ${settlementProfile.shippingCostAccountCode} is missing for payout ref ${payout.ref}.`
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
    ...(Number.isFinite(sellerDiscountAmount) && sellerDiscountAmount > 0 && salesDiscountAccountId
      ? [
          {
            accountId: salesDiscountAccountId,
            debit: sellerDiscountAmount,
            credit: 0,
            memo: `Diskon seller payout untuk ref ${payout.ref}`,
          },
        ]
      : []),
    ...(Number.isFinite(shippingCostAmount) && shippingCostAmount > 0 && shippingCostAccountId
      ? [
          {
            accountId: shippingCostAccountId,
            debit: shippingCostAmount,
            credit: 0,
            memo: `${settlementProfile.shippingCostLabel} untuk payout ref ${payout.ref}`,
          },
        ]
      : []),
    ...activeFeeComponents.flatMap((component) => {
      const feeExpenseAccountId = feeExpenseAccountIdByComponent[component.key];
      if (!feeExpenseAccountId) {
        return [];
      }

      return [
        {
          accountId: feeExpenseAccountId,
          debit: component.amount,
          credit: 0,
          memo: `${component.label} untuk payout ref ${payout.ref}`,
        },
      ];
    }),
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
    description: `Penerimaan payout ${settlementProfile.settlementLabel} ref ${payout.ref}`,
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
