import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";

export default function ContentInstagramPage() {
  return (
    <PageShell
      eyebrow="Konten"
      title="Instagram"
      description="Placeholder awal untuk membaca performa feed, reels, story, dan arah konten Instagram."
    >
      <ModulePlaceholder
        intro="Nanti halaman ini bisa menampung scorecard konten, recap posting, dan insight engagement Instagram."
        focusItems={[
          "Performa feed, reels, dan story.",
          "Posting yang paling kuat mendorong engagement atau klik.",
          "Ruang evaluasi tema visual dan konsistensi konten.",
        ]}
      />
    </PageShell>
  );
}
