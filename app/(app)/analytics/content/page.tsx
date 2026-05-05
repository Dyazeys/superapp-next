import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { SelectNative } from "@/components/ui/select-native";
import { getDailyUploadReport } from "@/lib/content-report";
import { ContentDailyCharts } from "@/features/analytics/content-daily-charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; product?: string }>;
}) {
  const params = await searchParams;
  const report = await getDailyUploadReport(params);

  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Daily Upload"
        description="Visualisasi tren aktivitas upload konten harian, breakdown per platform dan jenis konten."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <form method="get" className="grid gap-3 md:grid-cols-[220px_220px_minmax(0,1fr)_auto]">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Dari
            </p>
            <input
              type="date"
              name="from"
              defaultValue={report.from}
              className="block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-0 text-sm leading-10 text-slate-900 shadow-sm focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sampai
            </p>
            <input
              type="date"
              name="to"
              defaultValue={report.to}
              className="block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-0 text-sm leading-10 text-slate-900 shadow-sm focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
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
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Tampilkan
            </button>
          </div>
        </form>
      </WorkspacePanel>

      <ContentDailyCharts report={report} />
    </div>
  );
}
