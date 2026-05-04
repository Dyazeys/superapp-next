import { AlertTriangle } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { prisma } from "@/db/prisma";
import { ReportPnlFilters } from "@/features/analytics/report-pnl-filters";
import { getProfitAndLossReport, getPnlTimeSeries } from "@/lib/pnl-report";
import { PnlChartClient } from "@/components/charts/pnl-chart-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatMoney(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildMonthOptions() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const startYear = 2025;
  const options: { value: string; label: string }[] = [];

  for (let year = currentYear + 1; year >= startYear; year--) {
    for (let index = 0; index < 12; index++) {
      const date = new Date(Date.UTC(year, index, 1));
      const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);

      options.push({ value, label });
    }
  }

  return options;
}

function PnlBand({
  label,
  amount,
  highlighted = false,
  deduction = false,
}: {
  label: string;
  amount: number;
  highlighted?: boolean;
  deduction?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "flex items-center justify-between gap-4 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white"
          : deduction
            ? "flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50/40 px-5 py-2 text-sm text-rose-700"
            : "flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-white px-5 py-2 text-sm text-slate-900"
      }
    >
      <div className={highlighted ? "font-semibold" : deduction ? "pl-6 font-medium" : "font-semibold"}>
        {deduction ? <span className="mr-1.5">−</span> : null}
        {label}
      </div>
      <div className={`font-mono tabular-nums tracking-tight ${highlighted ? "text-base font-semibold" : "font-medium"}`}>
        {formatMoney(amount)}
      </div>
    </div>
  );
}

function PnlSection({
  code,
  label,
  amount,
  items,
}: {
  code?: string | null;
  label: string;
  amount: number;
  items?: Array<{ key: string; code?: string | null; label: string; amount: number }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/40 px-4 py-3">
        <div className="flex items-center gap-3">
          {code ? (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
              {code}
            </span>
          ) : null}
          <span className="text-sm font-semibold text-slate-900">{label}</span>
        </div>
        <span className="font-mono tabular-nums tracking-tight text-slate-900">{formatMoney(amount)}</span>
      </div>
      {items === undefined ? null : items.length > 0 ? (
        <div className="px-4 py-2">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className={`flex items-center justify-between gap-4 py-2 text-sm ${idx < items.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{item.code ?? ""}</span>
                <span className="text-slate-700">{item.label}</span>
              </div>
              <span className="font-mono tabular-nums tracking-tight font-medium text-slate-900">{formatMoney(item.amount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-slate-500">Belum ada detail biaya pada bagian ini.</div>
      )}
    </div>
  );
}

function monthRangeLabel(series: { month: string }[]) {
  if (!series.length) return "";
  const first = series[0].month;
  const last = series[series.length - 1].month;
  if (first === last) return first;
  return `${first} – ${last}`;
}

export default async function DashboardReportPnlPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const report = await getProfitAndLossReport({
    month: firstValue(params.month),
    channelId: firstValue(params.channelId),
  });
  const timeSeries = await getPnlTimeSeries(firstValue(params.channelId));
  const channels = await prisma.m_channel.findMany({
    orderBy: [{ channel_name: "asc" }],
    select: {
      channel_id: true,
      channel_name: true,
    },
  });
  const monthOptions = buildMonthOptions();
  const channelOptions = [
    { value: "", label: "Semua channel" },
    ...channels.map((channel) => ({
      value: String(channel.channel_id),
      label: channel.channel_name,
    })),
  ];

  const netProfitPositive = report.netProfit >= 0;

  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Filter Report"
        description="Pilih bulan dan channel untuk melihat laporan PNL."
        className="overflow-visible"
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <ReportPnlFilters
          monthOptions={monthOptions}
          channelOptions={channelOptions}
          defaultMonth={report.monthValue}
          defaultChannelId={report.channelId ? String(report.channelId) : ""}
        />
        <div className="mt-4 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Bulan:</span> {report.monthLabel}
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-medium text-slate-900">Channel:</span> {report.channelLabel}
        </div>
        {report.usesGlobalExpenses ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Filter channel saat ini hanya memfilter komponen sales dan payout. Biaya marketing, operasional, dan barter
              masih tampil global karena tabel opex belum punya dimensi channel.
            </p>
          </div>
        ) : null}
      </WorkspacePanel>

      {timeSeries.length > 0 ? (
        <WorkspacePanel
          title="Tren Bulanan"
          description={monthRangeLabel(timeSeries)}
          titleClassName="text-lg"
          descriptionClassName="text-xs leading-5"
        >
          <PnlChartClient series={timeSeries} />
        </WorkspacePanel>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <WorkspacePanel
          title="Sales Bridge"
          description="Ringkasan alur dari gross sales sampai gross profit margin."
          titleClassName="text-lg"
          descriptionClassName="text-xs leading-5"
        >
          <div className="space-y-2">
            <PnlBand label="Gross Sales" amount={report.grossSales} highlighted />
            <PnlBand label="Retur" amount={report.retur} deduction />
            <PnlBand label="Disc" amount={report.discount} deduction />
            <PnlBand label="Net Sales" amount={report.netSales} highlighted />
            <PnlBand label="Total Adjustment" amount={report.totalAdjustment} deduction={report.totalAdjustment < 0} />
            <PnlBand label="Hpp" amount={report.hpp} deduction />
            <PnlBand label="Gross Profit Margin" amount={report.grossProfitMargin} highlighted />
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Profit Builder"
          description="Komponen biaya yang mengurangi gross profit sampai net profit."
          titleClassName="text-lg"
          descriptionClassName="text-xs leading-5"
        >
          <div className="space-y-3">
            <PnlSection
              code={report.adminMarketplace.code}
              label={report.adminMarketplace.label}
              amount={report.adminMarketplace.amount}
              items={report.adminMarketplace.children}
            />
            <PnlSection code={report.affiliate.code} label={report.affiliate.label} amount={report.affiliate.amount} />
            <PnlSection
              code={report.marketing.code}
              label={report.marketing.label}
              amount={report.marketing.amount}
              items={report.marketing.children}
            />
            <PnlSection
              code={report.operational.code}
              label={report.operational.label}
              amount={report.operational.amount}
              items={report.operational.children}
            />
            <div
              className={
                netProfitPositive
                  ? "rounded-xl border border-emerald-200 bg-emerald-600 px-5 py-4 text-white shadow-lg"
                  : "rounded-xl border border-rose-200 bg-rose-600 px-5 py-4 text-white shadow-lg"
              }
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Net Profit</p>
                  <p className="mt-1 text-xs text-white/60">{netProfitPositive ? "Profit positif" : "Rugi periode ini"}</p>
                </div>
                <p className="text-3xl font-bold font-mono tabular-nums tracking-tight">{formatMoney(report.netProfit)}</p>
              </div>
            </div>
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
