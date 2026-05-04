import "server-only";
import { prisma } from "@/db/prisma";

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

function parseDateRange(from?: string | null, to?: string | null) {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return {
    from: from ? new Date(from + "T00:00:00.000Z") : defaultFrom,
    to: to ? new Date(to + "T23:59:59.999Z") : defaultTo,
  };
}

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export type ShopeeTrafficPoint = {
  date: string;
  grossSalesUsd: number;
  grossSalesLocal: number;
  orders: number;
  unitsSold: number;
  productViews: number;
  clicks: number;
  uniqueVisitors: number;
  conversionRate: number;
};

export type ShopeeTrafficReport = {
  totalGrossSalesUsd: number;
  totalGrossSalesLocal: number;
  totalOrders: number;
  totalUnitsSold: number;
  totalProductViews: number;
  totalClicks: number;
  avgConversionRate: number;
  timeSeries: ShopeeTrafficPoint[];
};

export async function getShopeeTrafficReport(input?: {
  from?: string;
  to?: string;
}): Promise<ShopeeTrafficReport> {
  const { from, to } = parseDateRange(input?.from, input?.to);

  const rows = await prisma.shopee_traffic.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, ShopeeTrafficPoint>();

  for (const row of rows) {
    const key = fmtDate(row.date);
    const existing = grouped.get(key) || {
      date: key,
      grossSalesUsd: 0,
      grossSalesLocal: 0,
      orders: 0,
      unitsSold: 0,
      productViews: 0,
      clicks: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
    };
    existing.grossSalesUsd += toNumber(row.gross_sales_usd);
    existing.grossSalesLocal += toNumber(row.gross_sales_local);
    existing.orders += toNumber(row.gross_orders);
    existing.unitsSold += toNumber(row.gross_units_sold);
    existing.productViews += toNumber(row.product_views);
    existing.clicks += toNumber(row.product_clicks);
    existing.uniqueVisitors += toNumber(row.unique_visitors);
    existing.conversionRate = Math.max(existing.conversionRate, toNumber(row.gross_order_conversion_rate));
    grouped.set(key, existing);
  }

  const timeSeries = Array.from(grouped.values());

  const sum = (key: keyof ShopeeTrafficPoint) =>
    timeSeries.reduce((s, p) => s + (typeof p[key] === "number" ? (p[key] as number) : 0), 0);

  return {
    totalGrossSalesUsd: sum("grossSalesUsd"),
    totalGrossSalesLocal: sum("grossSalesLocal"),
    totalOrders: sum("orders"),
    totalUnitsSold: sum("unitsSold"),
    totalProductViews: sum("productViews"),
    totalClicks: sum("clicks"),
    avgConversionRate:
      timeSeries.length > 0
        ? Math.round((timeSeries.reduce((s, p) => s + p.conversionRate, 0) / timeSeries.length) * 10000) / 10000
        : 0,
    timeSeries,
  };
}

export type ShopeeLivestreamPoint = {
  date: string;
  pengunjung: number;
  penontonTerbanyak: number;
  pesanan: number;
  penjualan: number;
};

export type ShopeeLivestreamReport = {
  totalSessions: number;
  totalPengunjung: number;
  totalPesanan: number;
  totalPenjualan: number;
  timeSeries: ShopeeLivestreamPoint[];
};

export async function getShopeeLivestreamReport(input?: {
  from?: string;
  to?: string;
}): Promise<ShopeeLivestreamReport> {
  const { from, to } = parseDateRange(input?.from, input?.to);

  const rows = await prisma.shopee_livestream.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, ShopeeLivestreamPoint>();

  for (const row of rows) {
    const key = fmtDate(row.date);
    const existing = grouped.get(key) || {
      date: key,
      pengunjung: 0,
      penontonTerbanyak: 0,
      pesanan: 0,
      penjualan: 0,
    };
    existing.pengunjung += toNumber(row.pengunjung);
    existing.penontonTerbanyak = Math.max(existing.penontonTerbanyak, toNumber(row.penonton_terbanyak));
    existing.pesanan += toNumber(row.pesanan);
    existing.penjualan += toNumber(row.penjualan);
    grouped.set(key, existing);
  }

  const timeSeries = Array.from(grouped.values());

  const sum = (key: keyof ShopeeLivestreamPoint) =>
    timeSeries.reduce((s, p) => s + (typeof p[key] === "number" ? (p[key] as number) : 0), 0);

  return {
    totalSessions: rows.length,
    totalPengunjung: sum("pengunjung"),
    totalPesanan: sum("pesanan"),
    totalPenjualan: sum("penjualan"),
    timeSeries,
  };
}

export type ShopeeAdsPoint = {
  date: string;
  spent: number;
  omset: number;
  roas: number;
  impression: number;
  click: number;
  ctr: number;
};

export type ShopeeAdsReport = {
  totalSpent: number;
  totalOmset: number;
  avgRoas: number;
  totalImpression: number;
  totalClick: number;
  avgCtr: number;
  timeSeries: ShopeeAdsPoint[];
  topProducts: AdsProductItem[];
};

export async function getShopeeAdsReport(input?: {
  from?: string;
  to?: string;
}): Promise<ShopeeAdsReport> {
  const { from, to } = parseDateRange(input?.from, input?.to);

  const rows = await prisma.mp_ads_shopee.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, ShopeeAdsPoint>();

  for (const row of rows) {
    const key = fmtDate(row.date);
    const existing = grouped.get(key) || {
      date: key,
      spent: 0,
      omset: 0,
      roas: 0,
      impression: 0,
      click: 0,
      ctr: 0,
    };
    existing.spent += toNumber(row.spent);
    existing.omset += toNumber(row.omset);
    existing.impression += toNumber(row.impression);
    existing.click += toNumber(row.click);
    const totalOmset = existing.omset;
    const totalSpent = existing.spent;
    existing.roas = totalSpent > 0 ? Math.round((totalOmset / totalSpent) * 100) / 100 : 0;
    existing.ctr =
      existing.impression > 0
        ? Math.round((existing.click / existing.impression) * 10000) / 10000
        : 0;
    grouped.set(key, existing);
  }

  const timeSeries = Array.from(grouped.values());

  const totalSpent = timeSeries.reduce((s, p) => s + p.spent, 0);
  const totalOmset = timeSeries.reduce((s, p) => s + p.omset, 0);
  const totalImpression = timeSeries.reduce((s, p) => s + p.impression, 0);
  const totalClick = timeSeries.reduce((s, p) => s + p.click, 0);

  return {
    totalSpent,
    totalOmset,
    avgRoas: totalSpent > 0 ? Math.round((totalOmset / totalSpent) * 100) / 100 : 0,
    totalImpression,
    totalClick,
    avgCtr: totalImpression > 0 ? Math.round((totalClick / totalImpression) * 10000) / 10000 : 0,
    timeSeries,
    topProducts: aggregateAdProducts(rows),
  };
}

export type AdsProductItem = {
  produk: string;
  spent: number;
  omset: number;
  roas: number;
  impression: number;
  click: number;
  ctr: number;
  orders: number;
};

function aggregateAdProducts(
  rows: { produk: string; impression: number; click: number; omset: { toString: () => string }; spent: { toString: () => string }; qty_buyer: number; qty_produk: number }[]
): AdsProductItem[] {
  const prodMap = new Map<string, AdsProductItem>();

  for (const row of rows) {
    const existing = prodMap.get(row.produk) || {
      produk: row.produk,
      spent: 0,
      omset: 0,
      roas: 0,
      impression: 0,
      click: 0,
      ctr: 0,
      orders: 0,
    };
    existing.spent += toNumber(row.spent);
    existing.omset += toNumber(row.omset);
    existing.impression += toNumber(row.impression);
    existing.click += toNumber(row.click);
    existing.orders += toNumber(row.qty_buyer);
    existing.roas = existing.spent > 0 ? Math.round((existing.omset / existing.spent) * 100) / 100 : 0;
    existing.ctr = existing.impression > 0 ? Math.round((existing.click / existing.impression) * 10000) / 10000 : 0;
    prodMap.set(row.produk, existing);
  }

  return Array.from(prodMap.values()).sort((a, b) => b.omset - a.omset);
}

/* ─── TikTok ──────────────────────────────────── */

export type TiktokTrafficPoint = {
  date: string;
  gmv: number;
  productsSold: number;
  buyers: number;
  pageViews: number;
  storeVisits: number;
  orders: number;
  productImpressions: number;
  productClicks: number;
  conversionRate: number;
};

export type TiktokTrafficReport = {
  totalGmv: number;
  totalOrders: number;
  totalProductImpressions: number;
  totalProductClicks: number;
  avgConversionRate: number;
  timeSeries: TiktokTrafficPoint[];
};

export async function getTiktokTrafficReport(input?: {
  from?: string;
  to?: string;
}): Promise<TiktokTrafficReport> {
  const { from, to } = parseDateRange(input?.from, input?.to);

  const rows = await prisma.tiktok_traffic.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, TiktokTrafficPoint>();

  for (const row of rows) {
    const key = fmtDate(row.date);
    const existing = grouped.get(key) || {
      date: key,
      gmv: 0,
      productsSold: 0,
      buyers: 0,
      pageViews: 0,
      storeVisits: 0,
      orders: 0,
      productImpressions: 0,
      productClicks: 0,
      conversionRate: 0,
    };
    existing.gmv += toNumber(row.gross_merchandise_value);
    existing.productsSold += toNumber(row.products_sold);
    existing.buyers += toNumber(row.buyers);
    existing.pageViews += toNumber(row.page_views);
    existing.storeVisits += toNumber(row.store_visits);
    existing.orders += toNumber(row.orders);
    existing.productImpressions += toNumber(row.product_impressions);
    existing.productClicks += toNumber(row.product_clicks);
    existing.conversionRate = Math.max(existing.conversionRate, toNumber(row.conversion_rate));
    grouped.set(key, existing);
  }

  const timeSeries = Array.from(grouped.values());

  const sum = (key: keyof TiktokTrafficPoint) =>
    timeSeries.reduce((s, p) => s + (typeof p[key] === "number" ? (p[key] as number) : 0), 0);

  return {
    totalGmv: sum("gmv"),
    totalOrders: sum("orders"),
    totalProductImpressions: sum("productImpressions"),
    totalProductClicks: sum("productClicks"),
    avgConversionRate:
      timeSeries.length > 0
        ? Math.round((timeSeries.reduce((s, p) => s + p.conversionRate, 0) / timeSeries.length) * 10000) / 10000
        : 0,
    timeSeries,
  };
}

export type TiktokLivestreamPoint = {
  date: string;
  impressions: number;
  views: number;
  productClicks: number;
  pesanan: number;
  penjualan: number;
};

export type TiktokLivestreamReport = {
  totalSessions: number;
  totalImpressions: number;
  totalViews: number;
  totalPesanan: number;
  totalPenjualan: number;
  timeSeries: TiktokLivestreamPoint[];
};

export async function getTiktokLivestreamReport(input?: {
  from?: string;
  to?: string;
}): Promise<TiktokLivestreamReport> {
  const { from, to } = parseDateRange(input?.from, input?.to);

  const rows = await prisma.tiktok_livestream.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, TiktokLivestreamPoint>();

  for (const row of rows) {
    const key = fmtDate(row.date);
    const existing = grouped.get(key) || {
      date: key,
      impressions: 0,
      views: 0,
      productClicks: 0,
      pesanan: 0,
      penjualan: 0,
    };
    existing.impressions += toNumber(row.impressions);
    existing.views += toNumber(row.views);
    existing.productClicks += toNumber(row.product_clicks);
    existing.pesanan += toNumber(row.pesanan);
    existing.penjualan += toNumber(row.penjualan);
    grouped.set(key, existing);
  }

  const timeSeries = Array.from(grouped.values());

  const sum = (key: keyof TiktokLivestreamPoint) =>
    timeSeries.reduce((s, p) => s + (typeof p[key] === "number" ? (p[key] as number) : 0), 0);

  return {
    totalSessions: rows.length,
    totalImpressions: sum("impressions"),
    totalViews: sum("views"),
    totalPesanan: sum("pesanan"),
    totalPenjualan: sum("penjualan"),
    timeSeries,
  };
}

export type TiktokAdsPoint = {
  date: string;
  spent: number;
  omset: number;
  roas: number;
  impression: number;
  click: number;
  ctr: number;
};

export type TiktokAdsReport = {
  totalSpent: number;
  totalOmset: number;
  avgRoas: number;
  totalImpression: number;
  totalClick: number;
  avgCtr: number;
  timeSeries: TiktokAdsPoint[];
  topProducts: AdsProductItem[];
};

export async function getTiktokAdsReport(input?: {
  from?: string;
  to?: string;
}): Promise<TiktokAdsReport> {
  const { from, to } = parseDateRange(input?.from, input?.to);

  const rows = await prisma.mp_ads_tiktok.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, TiktokAdsPoint>();

  for (const row of rows) {
    const key = fmtDate(row.date);
    const existing = grouped.get(key) || {
      date: key,
      spent: 0,
      omset: 0,
      roas: 0,
      impression: 0,
      click: 0,
      ctr: 0,
    };
    existing.spent += toNumber(row.spent);
    existing.omset += toNumber(row.omset);
    existing.impression += toNumber(row.impression);
    existing.click += toNumber(row.click);
    existing.roas = existing.spent > 0 ? Math.round((existing.omset / existing.spent) * 100) / 100 : 0;
    existing.ctr =
      existing.impression > 0
        ? Math.round((existing.click / existing.impression) * 10000) / 10000
        : 0;
    grouped.set(key, existing);
  }

  const timeSeries = Array.from(grouped.values());

  const totalSpent = timeSeries.reduce((s, p) => s + p.spent, 0);
  const totalOmset = timeSeries.reduce((s, p) => s + p.omset, 0);
  const totalImpression = timeSeries.reduce((s, p) => s + p.impression, 0);
  const totalClick = timeSeries.reduce((s, p) => s + p.click, 0);

  return {
    totalSpent,
    totalOmset,
    avgRoas: totalSpent > 0 ? Math.round((totalOmset / totalSpent) * 100) / 100 : 0,
    totalImpression,
    totalClick,
    avgCtr: totalImpression > 0 ? Math.round((totalClick / totalImpression) * 10000) / 10000 : 0,
    timeSeries,
    topProducts: aggregateAdProducts(rows),
  };
}
