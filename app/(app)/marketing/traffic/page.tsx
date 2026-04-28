import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";

export default function MarketingTrafficPage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Traffic"
      description="Placeholder awal untuk membaca sumber traffic, volume kunjungan, dan kualitas funnel per periode."
    >
      <ModulePlaceholder
        intro="Halaman ini cocok untuk traffic source, visit trend, dan jalur kunjungan yang paling efektif."
        focusItems={[
          "Ringkasan traffic per channel atau source.",
          "Trend kunjungan harian, mingguan, atau bulanan.",
          "Funnel view ke order untuk lihat kualitas traffic.",
        ]}
      />
    </PageShell>
  );
}
