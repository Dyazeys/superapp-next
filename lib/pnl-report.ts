import "server-only";
import { prisma } from "@/db/prisma";
import { isFailedPayoutStatus } from "@/lib/payout-status";

type PnlLeafRow = {
  key: string;
  code?: string | null;
  label: string;
  amount: number;
};

type PnlSectionRow = {
  key: string;
  code?: string | null;
  label: string;
  amount: number;
  children?: PnlLeafRow[];
};

export type ProfitAndLossReport = {
  monthValue: string;
  monthLabel: string;
  channelId: number | null;
  channelLabel: string;
  usesGlobalExpenses: boolean;
  grossSales: number;
  retur: number;
  discount: number;
  netSales: number;
  hpp: number;
  grossProfitMargin: number;
  adminMarketplace: PnlSectionRow;
  affiliate: PnlSectionRow;
  marketing: PnlSectionRow;
  operational: PnlSectionRow;
  netProfit: number;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(monthValue: string) {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return { start, end };
}

function monthLabel(monthValue: string) {
  const { start } = monthRange(monthValue);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);
}

function sortRows(rows: PnlLeafRow[]) {
  return [...rows].sort((left, right) => left.label.localeCompare(right.label));
}

export async function getProfitAndLossReport(input?: {
  month?: string | null;
  channelId?: string | null;
}): Promise<ProfitAndLossReport> {
  const monthValue = input?.month?.trim() || currentMonthValue();
  const { start, end } = monthRange(monthValue);
  const selectedChannelId = input?.channelId ? Number(input.channelId) : null;

  const payoutWhere = {
    payout_date: {
      gte: start,
      lt: end,
    },
    ...(selectedChannelId
      ? {
          t_order: {
            is: {
              channel_id: selectedChannelId,
            },
          },
        }
      : {}),
  };

  const opexWhere = {
    status: "POSTED" as const,
    is_product_barter: false,
    expense_date: {
      gte: start,
      lt: end,
    },
  };

  const barterWhere = {
    status: "POSTED" as const,
    barter_date: {
      gte: start,
      lt: end,
    },
  };

  const [payoutRows, manualOpexRows, barterRows, channel] = await Promise.all([
    prisma.t_payout.findMany({
      where: payoutWhere,
      select: {
        total_price: true,
        seller_discount: true,
        hpp: true,
        fee_admin: true,
        fee_service: true,
        fee_order_process: true,
        fee_program: true,
        fee_affiliate: true,
        payout_status: true,
      },
    }),
    prisma.operational_expenses.findMany({
      where: opexWhere,
      select: {
        amount: true,
        accounts_operational_expenses_expense_account_idToaccounts: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
    prisma.operational_expense_barter.findMany({
      where: barterWhere,
      select: {
        total_amount: true,
        accounts: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
    selectedChannelId
      ? prisma.m_channel.findUnique({
          where: { channel_id: selectedChannelId },
          select: {
            channel_name: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const settledPayoutRows = payoutRows.filter((row) => !isFailedPayoutStatus(row.payout_status));

  const grossSales = settledPayoutRows.reduce((sum, row) => sum + toNumber(row.total_price), 0);
  const retur = 0;
  const discount = settledPayoutRows.reduce((sum, row) => sum + toNumber(row.seller_discount), 0);
  const hpp = settledPayoutRows.reduce((sum, row) => sum + toNumber(row.hpp), 0);

  const adminChildren: PnlLeafRow[] = [
    {
      key: "admin-fee",
      label: "Admin fee",
      amount: settledPayoutRows.reduce((sum, row) => sum + toNumber(row.fee_admin), 0),
    },
    {
      key: "service-fee",
      label: "Biaya Layanan",
      amount: settledPayoutRows.reduce((sum, row) => sum + toNumber(row.fee_service), 0),
    },
    {
      key: "program-fee",
      label: "Biaya Program",
      amount: settledPayoutRows.reduce((sum, row) => sum + toNumber(row.fee_program), 0),
    },
    {
      key: "order-process-fee",
      label: "Biaya Proses Pesanan",
      amount: settledPayoutRows.reduce((sum, row) => sum + toNumber(row.fee_order_process), 0),
    },
  ].filter((row) => row.amount > 0);

  const affiliateAmount = settledPayoutRows.reduce((sum, row) => sum + toNumber(row.fee_affiliate), 0);

  const marketingMap = new Map<string, PnlLeafRow>();
  const operationalMap = new Map<string, PnlLeafRow>();

  const addExpenseRow = (code: string, name: string, amount: number) => {
    const isMarketing = code.startsWith("611");
    const target = isMarketing ? marketingMap : operationalMap;
    const existing = target.get(code);

    if (existing) {
      existing.amount += amount;
      return;
    }

    target.set(code, {
      key: code,
      code: null,
      label: name,
      amount,
    });
  };

  manualOpexRows.forEach((row) => {
    const account = row.accounts_operational_expenses_expense_account_idToaccounts;
    addExpenseRow(account.code, account.name, toNumber(row.amount));
  });

  barterRows.forEach((row) => {
    const account = row.accounts;
    addExpenseRow(account.code, account.name, toNumber(row.total_amount));
  });

  const marketingChildren = sortRows(Array.from(marketingMap.values())).map((row, index) => ({
    ...row,
    code: String.fromCharCode(97 + index),
  }));
  const operationalChildren = sortRows(Array.from(operationalMap.values())).map((row, index) => ({
    ...row,
    code: String.fromCharCode(97 + index),
  }));

  const adminMarketplaceAmount = adminChildren.reduce((sum, row) => sum + row.amount, 0);
  const marketingAmount = marketingChildren.reduce((sum, row) => sum + row.amount, 0);
  const operationalAmount = operationalChildren.reduce((sum, row) => sum + row.amount, 0);
  const netSales = grossSales - retur - discount;
  const grossProfitMargin = netSales - hpp;
  const netProfit = grossProfitMargin - adminMarketplaceAmount - affiliateAmount - marketingAmount - operationalAmount;

  return {
    monthValue,
    monthLabel: monthLabel(monthValue),
    channelId: selectedChannelId,
    channelLabel: channel?.channel_name ?? "Semua Channel",
    usesGlobalExpenses: Boolean(selectedChannelId),
    grossSales,
    retur,
    discount,
    netSales,
    hpp,
    grossProfitMargin,
    adminMarketplace: {
      key: "admin-marketplace",
      code: "A",
      label: "Admin MP",
      amount: adminMarketplaceAmount,
      children: adminChildren,
    },
    affiliate: {
      key: "affiliate",
      code: "C",
      label: "Affiliate",
      amount: affiliateAmount,
    },
    marketing: {
      key: "marketing",
      code: "D",
      label: "Biaya Marketing",
      amount: marketingAmount,
      children: marketingChildren,
    },
    operational: {
      key: "operational",
      code: "F",
      label: "Operasional",
      amount: operationalAmount,
      children: operationalChildren,
    },
    netProfit,
  };
}
