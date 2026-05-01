import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

export default function DataShopeePage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Data Shopee"
      description="Halaman ini masih placeholder — menunggu implementasi selanjutnya."
    >
      <div className="grid gap-6 xl:grid-cols-1">
        <WorkspacePanel
          title="Data Shopee"
          description="Dashboard dan laporan data Shopee."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Halaman <strong>Data Shopee</strong> akan menampilkan metrik performa toko Shopee,
              termasuk overview penjualan, traffic, dan analytics.
            </p>
            <p>
              Saat ini halaman ini masih placeholder dan belum berisi data.
            </p>
          </div>
        </WorkspacePanel>
      </div>
    </PageShell>
  );
}