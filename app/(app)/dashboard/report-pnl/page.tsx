import { AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { prisma } from "@/db/prisma";
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

  return (
    <PageShell
      eyebrow="Dashboard"
      title="Report PNL"
      description="Format PNL yang lebih nyaman dibaca untuk lihat sales, margin, biaya marketplace, biaya marketing, biaya operasional, dan net profit."
      className="[&>section:first-child_p:first-child]:text-[10px] [&>section:first-child_h1]:text-2xl [&>section:first-child_h1]:leading-none [&>section:first-child_p:last-child]:text-xs [&>section:first-child_p:last-child]:leading-5"
    >
      <WorkspacePanel
        title="Filter Report"
        description="Pilih bulan dan channel untuk melihat laporan PNL."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <form className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
          <Input type="month" name="month" defaultValue={report.monthValue} />
          <SelectNative name="channelId" defaultValue={report.channelId ? String(report.channelId) : ""}>
            <option value="">Semua channel</option>
            {channels.map((channel) => (
              <option key={channel.channel_id} value={String(channel.channel_id)}>
                {channel.channel_name}
              </option>
            ))}
          </SelectNative>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Tampilkan report
          </button>
        </form>
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
    </PageShell>
  );
}
