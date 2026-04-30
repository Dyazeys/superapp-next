import { Clock3, ReceiptText } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskAttendancePage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Absensi"
      description="Overview awal untuk area kehadiran harian, clock in/out, serta pengajuan izin atau sakit."
    >
      <ModuleHub
        summaryTitle="Fungsi utama"
        summaryDescription="Area ini dipakai untuk mencatat ritme kehadiran harian dan kebutuhan administratif dasar."
        bullets={[
          "Clock In / Out dipakai untuk jejak hadir harian, jam kerja, dan catatan operasional pribadi.",
          "Izin / Sakit dipakai untuk pengajuan absen terencana maupun mendadak beserta bukti pendukungnya.",
        ]}
        items={[
          {
            title: "Clock In / Out",
            description: "Tempat untuk check-in, check-out, riwayat kehadiran, dan catatan kerja harian.",
            href: "/task/absensi/clock-in-out",
            icon: Clock3,
          },
          {
            title: "Izin / Sakit",
            description: "Tempat pengajuan izin atau sakit, status approval, dan riwayat permohonan.",
            href: "/task/absensi/izin-sakit",
            icon: ReceiptText,
          },
        ]}
      />
    </PageShell>
  );
}
