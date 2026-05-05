"use client";

import { useState } from "react";
import { MarketingChart } from "@/components/charts/marketing-chart-client";
import { FunnelChart, type FunnelStage } from "@/components/charts/funnel-chart";
import type {
  TiktokTrafficReport,
  TiktokLivestreamReport,
  TiktokAdsReport,
} from "@/lib/marketing-report";
import { ProductLeaderboard } from "./marketing-shopee-charts";

type Tab = "traffic" | "livestream" | "ads";

function currency(value: number) {
  return "Rp" + new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function rate(value: number) {
  return (value * 100).toFixed(2) + "%";
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

function buildFunnel(data: TiktokTrafficReport): FunnelStage[] {
  return [
    { label: "Product Impressions", value: data.totalProductImpressions },
    { label: "Product Clicks", value: data.totalProductClicks },
    { label: "Orders", value: data.totalOrders },
    { label: "Avg Conversion", value: Math.round(data.avgConversionRate * 10000) },
  ];
}

function TrafficView({ data }: { data: TiktokTrafficReport }) {
  const funnel = buildFunnel(data);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total GMV" value={currency(data.totalGmv)} />
        <SummaryCard label="Total Orders" value={number(data.totalOrders)} />
        <SummaryCard label="Total Impressions" value={number(data.totalProductImpressions)} />
        <SummaryCard label="Avg Conversion" value={rate(data.avgConversionRate)} />
      </div>
      {data.totalProductImpressions > 0 || data.totalProductClicks > 0 ? (
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Funnel Traffic</h3>
          <FunnelChart stages={funnel} />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">
          Belum ada data traffic untuk periode ini.
        </p>
      )}
    </div>
  );
}

function LivestreamView({ data }: { data: TiktokLivestreamReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total Sesi" value={number(data.totalSessions)} />
        <SummaryCard label="Total Views" value={number(data.totalViews)} />
        <SummaryCard label="Total Impressions" value={number(data.totalImpressions)} />
        <SummaryCard label="Total Penjualan" value={currency(data.totalPenjualan)} accent="text-emerald-600" />
      </div>
      {data.timeSeries.length > 0 ? (
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Views & Sales</h3>
          <MarketingChart
            data={data.timeSeries}
            metrics={[
              { key: "views", label: "Views", color: "#1e293b", type: "area" },
              { key: "penjualan", label: "Penjualan", color: "#059669", type: "line" },
            ]}
          />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">
          Belum ada data livestream untuk periode ini.
        </p>
      )}
    </div>
  );
}

function AdsView({ data }: { data: TiktokAdsReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total Spent" value={currency(data.totalSpent)} />
        <SummaryCard label="Total Omset" value={currency(data.totalOmset)} accent="text-emerald-600" />
        <SummaryCard label="Avg ROAS" value={data.avgRoas.toFixed(2) + "x"} />
        <SummaryCard label="Avg CTR" value={rate(data.avgCtr)} />
      </div>
      {data.timeSeries.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Spend vs Revenue</h3>
              <MarketingChart
                data={data.timeSeries}
                metrics={[
                  { key: "spent", label: "Spent", color: "#dc2626", type: "bar" },
                  { key: "omset", label: "Omset", color: "#059669", type: "area" },
                ]}
              />
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">ROAS Trend</h3>
              <MarketingChart
                data={data.timeSeries}
                metrics={[
                  { key: "roas", label: "ROAS", color: "#d97706", type: "line" },
                ]}
              />
            </div>
          </div>
          <ProductLeaderboard products={data.topProducts} />
        </>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">
          Belum ada data MP Ads untuk periode ini.
        </p>
      )}
    </div>
  );
}

export function TiktokChartPanel({
  traffic,
  livestream,
  ads,
}: {
  traffic: TiktokTrafficReport;
  livestream: TiktokLivestreamReport;
  ads: TiktokAdsReport;
}) {
  const [tab, setTab] = useState<Tab>("traffic");

  const tabs: { key: Tab; label: string }[] = [
    { key: "traffic", label: "Traffic" },
    { key: "livestream", label: "Livestream" },
    { key: "ads", label: "MP Ads" },
  ];

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "traffic" && <TrafficView data={traffic} />}
      {tab === "livestream" && <LivestreamView data={livestream} />}
      {tab === "ads" && <AdsView data={ads} />}
    </div>
  );
}
