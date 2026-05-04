"use client";

import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency } from "@/lib/format";

type PnlChartProps = {
  series: { month: string; grossSales: number; grossProfitMargin: number }[];
};

export function PnlChart({ series }: PnlChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="grossSalesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e293b" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#1e293b" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gpmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeOpacity={0.5} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            dy={10}
            tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            dx={-4}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v: unknown) => formatCompactCurrency(typeof v === "number" ? v : Number(v) || 0)}
            width={72}
          />
          <Tooltip
            formatter={((value: unknown, name: string) => [
              formatCompactCurrency(typeof value === "number" ? value : Number(value) || 0),
              name === "grossSales" ? "Gross Sales" : "Gross Profit Margin",
            ]) as any}
            labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 4 }}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
              fontSize: 13,
            }}
          />
          <Legend
            formatter={(value: unknown) => (
              <span className="text-sm font-medium text-slate-700">{String(value)}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="grossSales"
            stroke="none"
            fill="url(#grossSalesGrad)"
          />
          <Line
            type="monotone"
            dataKey="grossSales"
            name="Gross Sales"
            stroke="#1e293b"
            strokeWidth={2}
            dot={{ r: 4, fill: "#1e293b", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#1e293b", stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="grossProfitMargin"
            stroke="none"
            fill="url(#gpmGrad)"
          />
          <Line
            type="monotone"
            dataKey="grossProfitMargin"
            name="Gross Profit Margin"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 4, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
