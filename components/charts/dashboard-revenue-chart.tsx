"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DashboardRevenuePoint } from "@/lib/dashboard";
import { formatCompactCurrency } from "@/lib/format";

type DashboardRevenueChartProps = {
  series: DashboardRevenuePoint[];
};

export function DashboardRevenueChart({ series }: DashboardRevenueChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="erpRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            dy={10}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
            formatter={(value) =>
              typeof value === "number" ? formatCompactCurrency(value) : String(value ?? "")
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-chart-2)"
            strokeWidth={3}
            fill="url(#erpRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
