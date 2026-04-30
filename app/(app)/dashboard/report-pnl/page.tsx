import { AlertTriangle } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { prisma } from "@/db/prisma";
import { ReportPnlFilters } from "@/features/analytics/report-pnl-filters";
import { getProfitAndLossReport } from "@/lib/pnl-report";

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

function buildMonthOptions(year = 2026) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year, index, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

    return { value, label };
  });
}

function toneClass(value: number) {
  if (value < 0) return "text-rose-700";
  return "text-slate-900";
}

function SummaryBand({
  label,
  amount,
  highlighted = false,
  compact = false,
}: {
  label: string;
  amount: number;
  highlighted?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "grid grid-cols-[minmax(0,1fr)_220px] items-center gap-4 rounded-2xl bg-[#4b74bd] px-4 py-2.5 text-sm text-white"
          : "grid grid-cols-[minmax(0,1fr)_220px] items-center gap-4 rounded-2xl px-4 py-1.5 text-sm"
      }
    >
      <div className={compact ? "pl-8 font-medium" : "font-semibold"}>{label}</div>
      <div className="text-right font-semibold tabular-nums">{formatMoney(amount)}</div>
    </div>
  );
}

function SectionCard({
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
    <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/75 p-4">
      <div className="grid grid-cols-[56px_minmax(0,1fr)_220px] items-center gap-4 border-b border-slate-200/80 pb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{code ?? ""}</div>
        <div className="text-base font-semibold text-slate-900">{label}</div>
        <div className={`text-right text-base font-semibold tabular-nums ${toneClass(amount)}`}>{formatMoney(amount)}</div>
      </div>
      <div className="mt-3 space-y-2">
        {items?.length ? (
          items.map((item) => (
            <div key={item.key} className="grid grid-cols-[56px_minmax(0,1fr)_220px] items-center gap-4 rounded-2xl bg-white px-3 py-2 text-sm">
              <div />
              <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 text-slate-700">
                <span className="text-xs text-slate-500">{item.code ?? ""}</span>
                <span>{item.label}</span>
              </div>
              <div className={`text-right font-medium tabular-nums ${toneClass(item.amount)}`}>{formatMoney(item.amount)}</div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-500">Belum ada detail biaya pada bagian ini.</div>
        )}
      </div>
    </div>
  );
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
  const channels = await prisma.m_channel.findMany({
    orderBy: [{ channel_name: "asc" }],
    select: {
      channel_id: true,
      channel_name: true,
    },
  });
  const monthOptions = buildMonthOptions(2026);
  const channelOptions = [
    { value: "", label: "Semua channel" },
    ...channels.map((channel) => ({
      value: String(channel.channel_id),
      label: channel.channel_name,
    })),
  ];

  return (
    <div className="space-y-6">
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
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
            Bulan: <span className="font-medium">{report.monthLabel}</span>
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
            Channel: <span className="font-medium">{report.channelLabel}</span>
          </span>
        </div>
        {report.usesGlobalExpenses ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Filter channel saat ini hanya memfilter komponen sales dan payout. Biaya marketing, operasional, dan barter
              masih tampil global karena tabel opex belum punya dimensi channel.
            </p>
          </div>
        ) : null}
      </WorkspacePanel>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <WorkspacePanel
          title="Sales Bridge"
          description="Ringkasan alur dari gross sales sampai gross profit margin."
          titleClassName="text-lg"
          descriptionClassName="text-xs leading-5"
        >
          <div className="space-y-2">
            <SummaryBand label="Gross Sales" amount={report.grossSales} highlighted />
            <SummaryBand label="Retur" amount={report.retur} compact />
            <SummaryBand label="Disc" amount={report.discount} compact />
            <SummaryBand label="Net Sales" amount={report.netSales} highlighted />
            <SummaryBand label="Hpp" amount={report.hpp} compact />
            <SummaryBand label="Gross Profit Margin" amount={report.grossProfitMargin} highlighted />
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Profit Builder"
          description="Komponen biaya yang mengurangi gross profit sampai net profit."
          titleClassName="text-lg"
          descriptionClassName="text-xs leading-5"
        >
          <div className="space-y-3">
            <SectionCard
              code={report.adminMarketplace.code}
              label={report.adminMarketplace.label}
              amount={report.adminMarketplace.amount}
              items={report.adminMarketplace.children}
            />
            <SectionCard code={report.affiliate.code} label={report.affiliate.label} amount={report.affiliate.amount} />
            <SectionCard
              code={report.marketing.code}
              label={report.marketing.label}
              amount={report.marketing.amount}
              items={report.marketing.children}
            />
            <SectionCard
              code={report.operational.code}
              label={report.operational.label}
              amount={report.operational.amount}
              items={report.operational.children}
            />
            <div className="rounded-[24px] bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Net Profit</p>
                  <p className="mt-1 text-xs text-slate-300">Gross profit margin dikurangi biaya utama.</p>
                </div>
                <p className="text-2xl font-semibold tabular-nums">{formatMoney(report.netProfit)}</p>
              </div>
            </div>
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
