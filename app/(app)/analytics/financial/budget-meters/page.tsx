import { Wallet } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { SelectNative } from "@/components/ui/select-native";
import { getBudgetMeterReport } from "@/lib/budget-meter";
import { Bar, currency } from "@/components/budget-meter/budget-group-card";
import { BudgetMeterGrid } from "@/features/analytics/budget-meter-grid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildMonthOptions() {
  const now = new Date();
  const endYear = now.getUTCFullYear() + 1;
  const months: { value: string; label: string }[] = [];
  for (let y = 2026; y <= endYear; y++) {
    const mEnd = y === endYear ? now.getUTCMonth() : 11;
    for (let m = 0; m <= mEnd; m++) {
      const date = new Date(Date.UTC(y, m, 1));
      months.push({
        value: `${y}-${String(m + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(date),
      });
    }
  }
  return months;
}

export default async function BudgetMetersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthOptions = buildMonthOptions();
  const report = await getBudgetMeterReport(params.month);
  const over = report.totalVariance < 0;

  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Filter Budget"
        description="Pilih bulan kerja untuk melihat budget dan realisasi beban."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <form className="grid gap-3 md:grid-cols-[220px_auto]">
          <SelectNative name="month" defaultValue={report.monthValue}>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </SelectNative>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Tampilkan meter
          </button>
        </form>
      </WorkspacePanel>

      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Ringkasan Budget Operasional
            </p>
            <p className="mt-0.5 text-xl font-bold tracking-tight">{report.monthLabel}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <Wallet className="size-4.5 text-white/70" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Total Budget</p>
            <p className="mt-0.5 text-lg font-bold">{currency(report.totalBudget)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Total Realisasi</p>
            <p className="mt-0.5 text-lg font-bold">{currency(report.totalRealisasi)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Variance</p>
            <p className={`mt-0.5 text-lg font-bold ${over ? "text-red-400" : "text-emerald-400"}`}>
              {over ? "" : "+"}{currency(report.totalVariance)}
            </p>
          </div>
        </div>
        <div className="mt-3.5">
          <Bar pct={report.totalUsagePercent} over={over} dark />
          <p className="mt-0.5 text-right text-xs text-white/40">{report.totalUsagePercent}%</p>
        </div>
      </div>

      <BudgetMeterGrid groups={report.groups} />
    </div>
  );
}
