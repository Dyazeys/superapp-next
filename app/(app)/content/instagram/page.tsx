import { PageShell } from "@/components/foundation/page-shell";
import { ContentDailyWorkspace } from "@/features/content/content-daily-workspace";

export default function ContentInstagramPage() {
  return (
    <PageShell
      eyebrow="Konten"
      title="Instagram"
      description="Input dan rekap konten harian Instagram — target produksi, actual posting, dan catatan per jenis konten."
    >
      <ContentDailyWorkspace
        platform="INSTAGRAM"
        platformLabel="Instagram"
      />
    </PageShell>
  );
}
