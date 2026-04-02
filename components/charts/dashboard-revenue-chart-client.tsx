"use client";

import dynamic from "next/dynamic";

export const DashboardRevenueChartClient = dynamic(
  () => import("@/components/charts/dashboard-revenue-chart").then((mod) => mod.DashboardRevenueChart),
  { ssr: false }
);
