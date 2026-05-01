import { PageShell } from "@/components/foundation/page-shell";
import { ContentDailyWorkspace } from "@/features/content/content-daily-workspace";

export default function ContentPage() {
  return (
    <PageShell
      eyebrow="Konten"
      title="Daily Upload"
      description="Catat dan pantau aktivitas upload konten harian untuk seluruh platform."
    >
      <ContentDailyWorkspace />
    </PageShell>
  );
}