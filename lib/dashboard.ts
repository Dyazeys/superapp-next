import "server-only";
import { prisma } from "@/db/prisma";

export type DashboardRevenuePoint = {
  name: string;
  revenue: number;
};

export type DashboardMetric = {
  totalOrders: number;
  totalRevenue: number;
  activeSku: number;
  activeCustomers: number;
  weekOrders: number;
};

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  at: Date;
};

export type DashboardReadinessItem = {
  label: string;
  state: "done" | "next";
};

export type DashboardOverview = {
  metrics: DashboardMetric;
  revenueSeries: DashboardRevenuePoint[];
  recentActivities: DashboardActivity[];
  readiness: DashboardReadinessItem[];
  lastUpdatedLabel: string;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

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

function formatRelativeTime(date: Date, now: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / (60 * 1000)));

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day ago`;
}

function getDayRange(offset: number, now: Date) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start.getTime() + ONE_DAY_MS);
  return { start, end };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 6 * ONE_DAY_MS);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getTime() - 29 * ONE_DAY_MS);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    weekOrders,
    activeSku,
    activeCustomers,
    revenueAggregate,
    weekOrderRows,
    recentOrders,
    recentStockMovements,
    payoutCount,
    journalCount,
  ] = await Promise.all([
    prisma.t_order.count(),
    prisma.t_order.count({ where: { order_date: { gte: weekStart } } }),
    prisma.master_product.count({ where: { is_active: true } }),
    prisma.master_customer.count({ where: { is_active: true } }),
    prisma.t_order.aggregate({
      _sum: {
        total_amount: true,
      },
      where: {
        order_date: {
          gte: monthStart,
        },
      },
    }),
    prisma.t_order.findMany({
      where: {
        order_date: {
          gte: weekStart,
        },
      },
      select: {
        order_date: true,
        total_amount: true,
      },
    }),
    prisma.t_order.findMany({
      take: 3,
      orderBy: [{ updated_at: "desc" }, { order_no: "desc" }],
      select: {
        order_no: true,
        status: true,
        total_amount: true,
        updated_at: true,
      },
    }),
    prisma.stock_movements.findMany({
      take: 2,
      orderBy: [{ movement_date: "desc" }, { id: "desc" }],
      select: {
        id: true,
        inv_code: true,
        reference_type: true,
        qty_change: true,
        movement_date: true,
      },
    }),
    prisma.t_payout.count(),
    prisma.journal_entries.count(),
  ]);

  const revenueByDay = new Map<string, number>();
  for (const row of weekOrderRows) {
    const key = row.order_date.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + toNumber(row.total_amount));
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const revenueSeries: DashboardRevenuePoint[] = Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index;
    const { start } = getDayRange(offset, now);
    const dayKey = start.toISOString().slice(0, 10);

    return {
      name: dayFormatter.format(start),
      revenue: revenueByDay.get(dayKey) ?? 0,
    };
  });

  const orderActivities: DashboardActivity[] = recentOrders.map((order) => ({
    id: `order-${order.order_no}`,
    title: `Sales order ${order.order_no} updated`,
    description: `Status ${order.status} with total ${toNumber(order.total_amount).toLocaleString("en-US")}.`,
    timestamp: formatRelativeTime(order.updated_at, now),
    at: order.updated_at,
  }));

  const stockActivities: DashboardActivity[] = recentStockMovements.map((movement) => ({
    id: `stock-${movement.id}`,
    title: `Stock movement ${movement.reference_type}`,
    description: `${movement.inv_code} changed ${movement.qty_change >= 0 ? "+" : ""}${movement.qty_change}.`,
    timestamp: formatRelativeTime(movement.movement_date, now),
    at: movement.movement_date,
  }));

  const recentActivities = [...orderActivities, ...stockActivities]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  const readiness: DashboardReadinessItem[] = [
    { label: "Sales orders ingested", state: totalOrders > 0 ? "done" : "next" },
    { label: "Product master active", state: activeSku > 0 ? "done" : "next" },
    { label: "Customer master active", state: activeCustomers > 0 ? "done" : "next" },
    { label: "Payout records available", state: payoutCount > 0 ? "done" : "next" },
    { label: "Accounting journals posted", state: journalCount > 0 ? "done" : "next" },
  ];

  const lastUpdatedLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(now);

  return {
    metrics: {
      totalOrders,
      totalRevenue: toNumber(revenueAggregate._sum.total_amount),
      activeSku,
      activeCustomers,
      weekOrders,
    },
    revenueSeries,
    recentActivities,
    readiness,
    lastUpdatedLabel,
  };
}
