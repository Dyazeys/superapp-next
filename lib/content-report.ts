import "server-only";
import { prisma } from "@/db/prisma";

export type DailyUploadDay = {
  date: string;
  tiktokVideo: number;
  igReels: number;
  igFeed: number;
  count: number;
};

export type DailyUploadBar = {
  label: string;
  count: number;
};

export type ProductPlatformRow = {
  produk: string;
  tiktokVideo: number;
  igReels: number;
  igFeed: number;
  total: number;
};

export type DailyUploadReport = {
  from: string;
  to: string;
  dateLabel: string;
  totalUploads: number;
  uniquePlatforms: number;
  uniqueProducts: number;
  uniquePics: number;
  timeSeries: DailyUploadDay[];
  byPlatform: DailyUploadBar[];
  byContentType: DailyUploadBar[];
  byStatus: DailyUploadBar[];
  byProductPlatform: ProductPlatformRow[];
  productOptions: string[];
};

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function currentMonthStart(): string {
  const now = new Date();
  return fmtDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
}

function currentMonthEnd(): string {
  const now = new Date();
  return fmtDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)));
}

function dateLabel(from: string, to: string) {
  const f = new Date(from + "T00:00:00Z");
  const t = new Date(to + "T00:00:00Z");
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  if (from === to) return fmt(f);
  return `${fmt(f)} – ${fmt(t)}`;
}

export async function getDailyUploadReport(input?: {
  from?: string | null;
  to?: string | null;
  product?: string | null;
}): Promise<DailyUploadReport> {
  const fromRaw = input?.from?.trim() || currentMonthStart();
  const toRaw = input?.to?.trim() || currentMonthEnd();

  const start = new Date(fromRaw + "T00:00:00Z");
  const end = new Date(toRaw + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 1);

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

  const tiktokMap = new Map<string, number>();
  const reelsMap = new Map<string, number>();
  const feedMap = new Map<string, number>();
  const platformMap = new Map<string, number>();
  const contentMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const productSet = new Set<string>();
  const picSet = new Set<string>();
  const productPlatformMap = new Map<string, { tiktokVideo: number; igReels: number; igFeed: number }>();

  for (const row of rows) {
    const day = fmtDate(row.tanggal_aktivitas);
    if (row.platform === "TikTok") {
      tiktokMap.set(day, (tiktokMap.get(day) ?? 0) + 1);
    } else if (row.platform === "Instagram" && row.jenis_konten === "Reel") {
      reelsMap.set(day, (reelsMap.get(day) ?? 0) + 1);
    } else if (row.platform === "Instagram" && row.jenis_konten === "Feed") {
      feedMap.set(day, (feedMap.get(day) ?? 0) + 1);
    }
    platformMap.set(row.platform, (platformMap.get(row.platform) ?? 0) + 1);
    contentMap.set(row.jenis_konten, (contentMap.get(row.jenis_konten) ?? 0) + 1);
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
    if (row.produk) productSet.add(row.produk);
    if (row.pic) picSet.add(row.pic);

    if (row.produk) {
      const prev = productPlatformMap.get(row.produk) ?? { tiktokVideo: 0, igReels: 0, igFeed: 0 };
      if (row.platform === "TikTok") {
        prev.tiktokVideo += 1;
      } else if (row.platform === "Instagram" && row.jenis_konten === "Reel") {
        prev.igReels += 1;
      } else if (row.platform === "Instagram" && row.jenis_konten === "Feed") {
        prev.igFeed += 1;
      }
      productPlatformMap.set(row.produk, prev);
    }
  }

  const timeSeries: DailyUploadDay[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const d = fmtDate(cursor);
    timeSeries.push({
      date: d,
      tiktokVideo: tiktokMap.get(d) ?? 0,
      igReels: reelsMap.get(d) ?? 0,
      igFeed: feedMap.get(d) ?? 0,
      count: (tiktokMap.get(d) ?? 0) + (reelsMap.get(d) ?? 0) + (feedMap.get(d) ?? 0),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const allProducts = await prisma.daily_uploads.findMany({
    distinct: ["produk"],
    select: { produk: true },
    orderBy: { produk: "asc" },
  });

  const productOptions = allProducts
    .map((r) => r.produk)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  const byProductPlatform = Array.from(productPlatformMap.entries())
    .map(([produk, counts]) => ({
      produk,
      ...counts,
      total: counts.tiktokVideo + counts.igReels + counts.igFeed,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    from: fromRaw,
    to: toRaw,
    dateLabel: dateLabel(fromRaw, toRaw),
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
    byProductPlatform,
    productOptions,
  };
}
