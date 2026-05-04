import dynamic from "next/dynamic";

export const MarketingChart = dynamic(
  () => import("@/components/charts/marketing-chart").then((m) => m.MarketingChart),
  { ssr: false }
);
