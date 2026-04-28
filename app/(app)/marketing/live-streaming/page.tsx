import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";

export default function MarketingLiveStreamingPage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Live Streaming"
      description="Placeholder awal untuk merangkum jadwal live, performa session, dan dampaknya ke traffic atau penjualan."
    >
      <ModulePlaceholder
        intro="Nanti halaman ini bisa dipakai untuk recap host, session, viewers, engagement, dan hasil penjualan dari live."
        focusItems={[
          "Jadwal dan recap session live.",
          "Viewer, engagement, dan product push selama live.",
          "Kontribusi live terhadap order atau omzet.",
        ]}
      />
    </PageShell>
  );
}
