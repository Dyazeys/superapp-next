import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

export default function DataTiktokPage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Data TikTok"
      description="Halaman ini masih placeholder — menunggu implementasi selanjutnya."
    >
      <div className="grid gap-6 xl:grid-cols-1">
        <WorkspacePanel
          title="Data TikTok"
          description="Dashboard dan laporan data TikTok."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Halaman <strong>Data TikTok</strong> akan menampilkan metrik performa toko TikTok,
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