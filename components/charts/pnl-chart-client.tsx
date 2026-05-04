"use client";

import dynamic from "next/dynamic";

const PnlChart = dynamic(
  () => import("@/components/charts/pnl-chart").then((m) => m.PnlChart),
  { ssr: false }
);

export function PnlChartClient(props: {
  series: { month: string; grossSales: number; grossProfitMargin: number }[];
}) {
  return <PnlChart {...props} />;
}
