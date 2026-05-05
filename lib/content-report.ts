import "server-only";
import { prisma } from "@/db/prisma";

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

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export type DailyUploadDay = {
  date: string;
  count: number;
};

export type DailyUploadBar = {
  label: string;
  count: number;
};

export type DailyUploadReport = {
  monthValue: string;
  monthLabel: string;
  totalUploads: number;
  uniquePlatforms: number;
  uniqueProducts: number;
  uniquePics: number;
  timeSeries: DailyUploadDay[];
  byPlatform: DailyUploadBar[];
  byContentType: DailyUploadBar[];
  byStatus: DailyUploadBar[];
  productOptions: string[];
};

export async function getDailyUploadReport(input?: {
  month?: string | null;
  product?: string | null;
}): Promise<DailyUploadReport> {
  const monthValue = input?.month?.trim() || currentMonthValue();
  const { start, end } = monthRange(monthValue);

  const where: Record<string, unknown> = {
    tanggal_aktivitas: { gte: start, lt: end },
  };

  if (input?.product?.trim()) {
    where.produk = input.product.trim();
  }

  const rows = await prisma.daily_uploads.findMany({
    where,
    orderBy: { tanggal_aktivitas: "asc" },
    select: {
      tanggal_aktivitas: true,
      platform: true,
      jenis_konten: true,
      status: true,
      produk: true,
      pic: true,
    },
  });

  // Time series by day
  const dayMap = new Map<string, number>();
  const platformMap = new Map<string, number>();
  const contentMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const productSet = new Set<string>();
  const picSet = new Set<string>();

  for (const row of rows) {
    const day = fmtDate(row.tanggal_aktivitas);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    platformMap.set(row.platform, (platformMap.get(row.platform) ?? 0) + 1);
    contentMap.set(row.jenis_konten, (contentMap.get(row.jenis_konten) ?? 0) + 1);
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
    if (row.produk) productSet.add(row.produk);
    if (row.pic) picSet.add(row.pic);
  }

  // Generate all dates in the month for continuous time series
  const timeSeries: DailyUploadDay[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const d = fmtDate(cursor);
    timeSeries.push({ date: d, count: dayMap.get(d) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Product options from ALL data (not filtered by month)
  const allProducts = await prisma.daily_uploads.findMany({
    distinct: ["produk"],
    select: { produk: true },
    orderBy: { produk: "asc" },
  });

  const productOptions = allProducts
    .map((r) => r.produk)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  return {
    monthValue,
    monthLabel: monthLabel(monthValue),
    totalUploads: rows.length,
    uniquePlatforms: platformMap.size,
    uniqueProducts: productSet.size,
    uniquePics: picSet.size,
    timeSeries,
    byPlatform: Array.from(platformMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    byContentType: Array.from(contentMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    byStatus: Array.from(statusMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    productOptions,
  };
}
