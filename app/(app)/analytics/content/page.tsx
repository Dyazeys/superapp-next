import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { SelectNative } from "@/components/ui/select-native";
import { getDailyUploadReport } from "@/lib/content-report";
import { ContentDailyCharts } from "@/features/analytics/content-daily-charts";

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

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; product?: string }>;
}) {
  const params = await searchParams;
  const monthOptions = buildMonthOptions();
  const report = await getDailyUploadReport(params);

  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Daily Upload"
        description="Visualisasi tren aktivitas upload konten harian, breakdown per platform dan jenis konten."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Bulan
            </p>
            <SelectNative name="month" defaultValue={report.monthValue}>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </SelectNative>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Produk
            </p>
            <SelectNative name="product" defaultValue={params.product || ""}>
              <option value="">Semua Produk</option>
              {report.productOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectNative>
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Tampilkan
          </button>
        </form>
      </WorkspacePanel>

      <ContentDailyCharts report={report} />
    </div>
  );
}
