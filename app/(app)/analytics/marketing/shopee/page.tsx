import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import {
  getShopeeTrafficReport,
  getShopeeLivestreamReport,
  getShopeeAdsReport,
} from "@/lib/marketing-report";
import { ShopeeChartPanel } from "@/features/analytics/marketing-shopee-charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopeePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  const [traffic, livestream, ads] = await Promise.all([
    getShopeeTrafficReport(params),
    getShopeeLivestreamReport(params),
    getShopeeAdsReport(params),
  ]);

  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Data Shopee"
        description="Visualisasi traffic toko, performa livestream, dan efektivitas MP Ads."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <form method="get" className="grid gap-3 md:grid-cols-[220px_220px_auto]">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Dari
            </p>
            <input
              type="date"
              name="from"
              defaultValue={params.from || ""}
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
              defaultValue={params.to || ""}
              className="block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-0 text-sm leading-10 text-slate-900 shadow-sm focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
            />
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

      <ShopeeChartPanel traffic={traffic} livestream={livestream} ads={ads} />
    </div>
  );
}
