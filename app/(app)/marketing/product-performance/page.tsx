import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";

export default function MarketingProductPerformancePage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Performa Produk"
      description="Placeholder awal untuk membaca performa produk dari sisi kontribusi sales, margin, dan aktivitas promosi."
    >
      <ModulePlaceholder
        intro="Nanti halaman ini cocok untuk top product, low performer, dan perubahan performa antar periode."
        focusItems={[
          "Top product berdasarkan sales atau margin.",
          "Produk yang perlu didorong ulang karena performanya melemah.",
          "Perbandingan produk promo vs non-promo.",
        ]}
      />
    </PageShell>
  );
}
