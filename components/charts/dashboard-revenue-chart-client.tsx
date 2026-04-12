"use client";

import dynamic from "next/dynamic";
import type { DashboardRevenuePoint } from "@/lib/dashboard";

type DashboardRevenueChartClientProps = {
  series: DashboardRevenuePoint[];
};

const DashboardRevenueChart = dynamic(
  () => import("@/components/charts/dashboard-revenue-chart").then((mod) => mod.DashboardRevenueChart),
  { ssr: false }
);

export function DashboardRevenueChartClient({ series }: DashboardRevenueChartClientProps) {
  return <DashboardRevenueChart series={series} />;
}
