import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskMyCalendarPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Kalender Saya"
      description="Placeholder awal untuk jadwal pribadi, deadline, meeting yang perlu dihadiri, dan ritme target mingguan."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai sebagai kalender kerja pribadi supaya user bisa membaca ritme waktu, bukan cuma daftar tugas."
        focusItems={[
          "Deadline tugas, target mingguan, dan agenda kerja yang perlu dijaga urutannya.",
          "Jadwal meeting yang relevan ke user agar benturan agenda bisa terlihat lebih awal.",
          "Ringkasan izin, cuti, atau hari-hari penting lain yang memengaruhi ritme kerja personal.",
        ]}
      />
    </PageShell>
  );
}
