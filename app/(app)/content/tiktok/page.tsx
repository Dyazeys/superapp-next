import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";

export default function ContentTiktokPage() {
  return (
    <PageShell
      eyebrow="Konten"
      title="Tiktok"
      description="Placeholder awal untuk evaluasi performa konten TikTok dan ritme produksi kontennya."
    >
      <ModulePlaceholder
        intro="Halaman ini cocok untuk performa video, engagement, cadence posting, dan ide konten yang lagi efektif."
        focusItems={[
          "Performa video dan trend view per periode.",
          "Engagement rate, save, share, dan klik keluar.",
          "Daftar konten yang perlu diulang atau dikembangkan lagi.",
        ]}
      />
    </PageShell>
  );
}
