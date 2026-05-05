"use client";

import { MarketingChart } from "@/components/charts/marketing-chart-client";
import type { DailyUploadReport, DailyUploadBar } from "@/lib/content-report";

function number(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tracking-tight ${accent || "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function HorizontalBarList({ items, color }: { items: DailyUploadBar[]; color: string }) {
  const max = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;
  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const pct = max > 0 ? (item.count / max) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-slate-600">{item.label}</span>
            <div className="h-5 flex-1 overflow-hidden rounded-md bg-slate-100">
              <div
                className="h-full rounded-md"
                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-10 text-right text-xs font-medium tabular-nums text-slate-900">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ContentDailyCharts({ report }: { report: DailyUploadReport }) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total Upload" value={number(report.totalUploads)} />
        <SummaryCard label="Platform" value={number(report.uniquePlatforms)} />
        <SummaryCard label="Produk" value={number(report.uniqueProducts)} />
        <SummaryCard label="PIC Active" value={number(report.uniquePics)} />
      </div>

      {/* Time-series: Trend harian */}
      {report.timeSeries.length > 0 ? (
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Trend Upload — {report.monthLabel}
          </h3>
          <MarketingChart
            data={report.timeSeries}
            metrics={[
              { key: "tiktokVideo", label: "Video TikTok", color: "#1e293b", type: "area" },
              { key: "igReels", label: "IG Reels", color: "#059669", type: "line" },
              { key: "igFeed", label: "IG Feed", color: "#3b82f6", type: "line" },
            ]}
            height={260}
          />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">
          Belum ada data upload untuk bulan ini.
        </p>
      )}

      {/* Breakdown charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">By Platform</h3>
          {report.byPlatform.length > 0 ? (
            <HorizontalBarList items={report.byPlatform} color="#1e293b" />
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">Belum ada data</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">By Jenis Konten</h3>
          {report.byContentType.length > 0 ? (
            <HorizontalBarList items={report.byContentType} color="#3b82f6" />
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      {report.byStatus.length > 0 && (
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">By Status</h3>
          <HorizontalBarList items={report.byStatus} color="#059669" />
        </div>
      )}
    </div>
  );
}
