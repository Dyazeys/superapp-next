"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartMetric = {
  key: string;
  label: string;
  color: string;
  type: "area" | "line" | "bar";
  yAxisId?: string;
};

export type MarketingChartProps = {
  data: Record<string, unknown>[];
  metrics: ChartMetric[];
  xKey?: string;
  height?: number;
};

const defaultColors = ["#1e293b", "#059669", "#d97706", "#dc2626", "#6366f1", "#0891b2"];

export function MarketingChart({ data, metrics, xKey = "date", height = 280 }: MarketingChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <defs>
            {metrics.map((m, i) => (
              <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={m.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeOpacity={0.5} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            dy={10}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            dx={-4}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            width={72}
          />
          <Tooltip
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
          {metrics.map((m, i) => {
            const color = m.color || defaultColors[i % defaultColors.length];
            const baseProps = {
              dataKey: m.key,
              name: m.label,
              yAxisId: m.yAxisId || "left",
              stroke: color,
              fill: color,
              strokeWidth: m.type === "line" ? 2 : 0,
              dot: m.type === "line" ? { r: 3, fill: color, stroke: "#fff", strokeWidth: 2 } : false,
              activeDot: m.type === "line" ? { r: 4, fill: color, stroke: "#fff", strokeWidth: 2 } : false,
            };

            if (m.type === "area") {
              return <Area key={m.key} {...baseProps} fill={`url(#grad-${m.key})`} type="monotone" />;
            }
            if (m.type === "bar") {
              return <Bar key={m.key} {...baseProps} radius={[4, 4, 0, 0]} fill={color} />;
            }
            return <Line key={m.key} {...baseProps} type="monotone" />;
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
