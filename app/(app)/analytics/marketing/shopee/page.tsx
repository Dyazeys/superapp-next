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
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Dari
            </p>
            <input
              type="date"
              name="from"
              defaultValue={params.from || ""}
              className="block h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Sampai
            </p>
            <input
              type="date"
              name="to"
              defaultValue={params.to || ""}
              className="block h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Tampilkan
          </button>
        </form>
      </WorkspacePanel>

      <ShopeeChartPanel traffic={traffic} livestream={livestream} ads={ads} />
    </div>
  );
}
