import "server-only";
import { prisma } from "@/db/prisma";

type BudgetSubItemInput = {
  label: string;
  budget: number;
};

type BudgetGroupInput = {
  code: string;
  label: string;
  budget: number;
  items: BudgetSubItemInput[];
};

const BUDGET_GROUPS: BudgetGroupInput[] = [
  {
    code: "62101",
    label: "Gaji & Insentif",
    budget: 35_350_000,
    items: [
      { label: "Gaji", budget: 32_950_000 },
      { label: "Insentif", budget: 2_400_000 },
    ],
  },
  {
    code: "62102",
    label: "Listrik & Internet",
    budget: 4_800_000,
    items: [
      { label: "Listrik", budget: 1_050_000 },
      { label: "Wifi", budget: 2_100_000 },
      { label: "Kuota", budget: 100_000 },
      { label: "Server", budget: 1_450_000 },
      { label: "Air", budget: 100_000 },
    ],
  },
  {
    code: "62103",
    label: "Operasional CC",
    budget: 650_000,
    items: [
      { label: "BBM", budget: 250_000 },
      { label: "Tools Berlangganan", budget: 300_000 },
      { label: "Konsumsi CC", budget: 100_000 },
    ],
  },
  {
    code: "62104",
    label: "Kendaraan",
    budget: 1_000_000,
    items: [
      { label: "Service & Maintenance", budget: 500_000 },
      { label: "Pajak Kendaraan", budget: 500_000 },
    ],
  },
  {
    code: "62105",
    label: "Konsumsi & ATK",
    budget: 400_000,
    items: [
      { label: "Stok", budget: 300_000 },
      { label: "Acara", budget: 100_000 },
    ],
  },
  {
    code: "62106",
    label: "Entertain",
    budget: 1_050_000,
    items: [
      { label: "Dinas Luar", budget: 150_000 },
      { label: "Tamu", budget: 150_000 },
      { label: "Keamanan/Sumbangan", budget: 250_000 },
      { label: "Bensin", budget: 500_000 },
    ],
  },
  {
    code: "62107",
    label: "Pengembangan SDM",
    budget: 350_000,
    items: [
      { label: "Kajian Rutin", budget: 300_000 },
      { label: "Workshop", budget: 50_000 },
    ],
  },
  {
    code: "62108",
    label: "Ongkir",
    budget: 300_000,
    items: [
      { label: "Ongkir pengiriman (non MP & Reseller)", budget: 300_000 },
    ],
  },
  {
    code: "62109",
    label: "R & D",
    budget: 250_000,
    items: [
      { label: "Sampling", budget: 150_000 },
      { label: "dll", budget: 100_000 },
    ],
  },
  {
    code: "62110",
    label: "Gedung",
    budget: 350_000,
    items: [
      { label: "Maintenance", budget: 250_000 },
      { label: "dll", budget: 100_000 },
    ],
  },
  {
    code: "62111",
    label: "Maintenance Inventaris Kantor",
    budget: 350_000,
    items: [
      { label: "Service", budget: 200_000 },
      { label: "Beli part", budget: 150_000 },
    ],
  },
];

export type BudgetSubItem = {
  label: string;
  budget: number;
  realisasi: number;
};

export type BudgetMeterGroup = {
  code: string;
  label: string;
  budget: number;
  realisasi: number;
  variance: number;
  usagePercent: number;
  items: BudgetSubItem[];
};

export type BudgetMeterReport = {
  monthValue: string;
  monthLabel: string;
  groups: BudgetMeterGroup[];
  totalBudget: number;
  totalRealisasi: number;
  totalVariance: number;
  totalUsagePercent: number;
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

function currentMonthValue() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getBudgetMeterReport(
  month?: string | null
): Promise<BudgetMeterReport> {
  const monthValue = month?.trim() || currentMonthValue();
  const { start, end } = monthRange(monthValue);

  const opexWhere = {
    status: "POSTED" as const,
    is_product_barter: false,
    expense_date: { gte: start, lt: end },
  };

  const barterWhere = {
    status: "POSTED" as const,
    barter_date: { gte: start, lt: end },
  };

  const [opexRows, barterRows] = await Promise.all([
    prisma.operational_expenses.findMany({
      where: opexWhere,
      select: {
        amount: true,
        expense_label: true,
        accounts_operational_expenses_expense_account_idToaccounts: {
          select: { code: true },
        },
      },
    }),
    prisma.operational_expense_barter.findMany({
      where: barterWhere,
      select: {
        total_amount: true,
        expense_label: true,
        accounts: { select: { code: true } },
      },
    }),
  ]);

  const realisasiByCode = new Map<string, number>();
  const realisasiByLabel = new Map<string, Map<string, number>>();

  const accumulate = (code: string, amount: number, label: string | null) => {
    realisasiByCode.set(code, (realisasiByCode.get(code) ?? 0) + amount);

    if (!realisasiByLabel.has(code)) {
      realisasiByLabel.set(code, new Map());
    }
    const labelMap = realisasiByLabel.get(code)!;
    const key = label ?? "Lainnya";
    labelMap.set(key, (labelMap.get(key) ?? 0) + amount);
  };

  for (const row of opexRows) {
    const code = row.accounts_operational_expenses_expense_account_idToaccounts.code;
    if (code.startsWith("621")) {
      accumulate(code, toNumber(row.amount), row.expense_label);
    }
  }

  for (const row of barterRows) {
    const code = row.accounts.code;
    if (code.startsWith("621")) {
      accumulate(code, toNumber(row.total_amount), row.expense_label);
    }
  }

  let totalBudget = 0;
  let totalRealisasi = 0;

  const groups = BUDGET_GROUPS.map((group) => {
    const realisasi = realisasiByCode.get(group.code) ?? 0;
    const variance = group.budget - realisasi;
    const usagePercent =
      group.budget > 0
        ? Math.round((realisasi / group.budget) * 100 * 10) / 10
        : 0;

    const labelMap = realisasiByLabel.get(group.code) ?? new Map();

    const items = group.items.map((item) => ({
      label: item.label,
      budget: item.budget,
      realisasi: labelMap.get(item.label) ?? 0,
    }));

    totalBudget += group.budget;
    totalRealisasi += realisasi;

    return {
      code: group.code,
      label: group.label,
      budget: group.budget,
      realisasi,
      variance,
      usagePercent,
      items,
    };
  });

  const totalVariance = totalBudget - totalRealisasi;
  const totalUsagePercent =
    totalBudget > 0
      ? Math.round((totalRealisasi / totalBudget) * 100 * 10) / 10
      : 0;

  return {
    monthValue,
    monthLabel: monthLabel(monthValue),
    groups,
    totalBudget,
    totalRealisasi,
    totalVariance,
    totalUsagePercent,
  };
}
