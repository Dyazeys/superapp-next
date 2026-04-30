import { PageShell } from "@/components/foundation/page-shell";
import { ContentDailyWorkspace } from "@/features/content/content-daily-workspace";

export default function ContentTiktokPage() {
  return (
    <PageShell
      eyebrow="Konten"
      title="TikTok"
      description="Input dan rekap konten harian TikTok — target produksi, actual posting, dan catatan per jenis konten."
    >
      <ContentDailyWorkspace
        platform="TIKTOK"
        platformLabel="TikTok"
      />
    </PageShell>
  );
}
