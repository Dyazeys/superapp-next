import { ArrowRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

export default function MarketingProductPerformancePage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Performa Produk"
      description="Visualisasi performa produk tersedia di menu Analytic."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <WorkspacePanel
          title="Dialihkan ke Analytic"
          description="Dashboard performa produk telah dipindahkan."
        >
          <div className="rounded-[24px] bg-slate-900 px-5 py-6 text-white">
            <BarChart3 className="mb-3 size-8 text-slate-300" />
            <p className="text-xl font-semibold">Visualisasi ada di Analytic</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Ranking SKU, conversion rate, dan indikator performa produk 
              dapat diakses melalui menu Analytic.
            </p>
            <Link
              href="/analytics"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              Buka Analytic
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Catatan"
          description="Halaman ini hanya sebagai landing page."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Halaman ini tidak menampilkan data transaksi. Seluruh visualisasi 
              dan dashboard marketing telah dialihkan ke menu <strong>Analytic</strong>.
            </p>
          </div>
        </WorkspacePanel>
      </div>
    </PageShell>
  );
}
