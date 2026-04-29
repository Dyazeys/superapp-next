import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamCalendarPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Kalender Tim"
      description="Placeholder awal untuk jadwal bersama, agenda lintas tim, deadline kolektif, dan event operasional."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai sebagai peta waktu bersama agar tim lebih mudah sinkron soal agenda dan beban kerja."
        focusItems={[
          "Jadwal meeting, campaign, deadline besar, dan event operasional lintas divisi.",
          "Informasi cuti atau kehadiran tim yang memengaruhi kapasitas kerja bersama.",
          "Kalender bersama yang bisa jadi titik rujukan untuk alignment mingguan atau bulanan.",
        ]}
      />
    </PageShell>
  );
}
