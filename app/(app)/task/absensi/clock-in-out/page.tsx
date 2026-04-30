import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskAttendanceClockPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Clock In / Out"
      description="Placeholder awal untuk proses check-in, check-out, dan ringkasan kehadiran harian."
    >
      <ModulePlaceholder
        intro="Halaman ini akan menjadi titik masuk absensi harian untuk mulai kerja, selesai kerja, dan melihat riwayat hadir."
        focusItems={[
          "Tombol check-in dan check-out dengan timestamp yang jelas.",
          "Ringkasan jam kerja hari ini, keterlambatan, dan catatan kehadiran.",
          "Riwayat absensi pribadi lengkap dengan lokasi, catatan, atau bukti kehadiran bila dibutuhkan.",
        ]}
      />
    </PageShell>
  );
}
