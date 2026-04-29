import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamMeetingTodoPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Meeting To Do"
      description="Placeholder awal untuk daftar tindak lanjut hasil meeting dan koordinasi antar PIC."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk menjaga action item hasil meeting tetap terlihat, terukur, dan tidak hilang setelah rapat selesai."
        focusItems={[
          "Daftar to do hasil meeting lengkap dengan PIC, deadline, dan prioritas.",
          "Status progres dari tiap action item: to do, in progress, done, atau blocked.",
          "Komentar lanjutan, catatan follow-up, dan tautan kembali ke meeting sumbernya.",
        ]}
      />
    </PageShell>
  );
}
