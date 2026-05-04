import { CalendarDays, ClipboardList, Clock3, Gauge } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Task overview"
      description="Overview ini menjelaskan workspace personal untuk ritme kerja harian: tugas aktif, target pribadi, absensi, kalender pribadi, dan reminder."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Apa isi modul ini?" description="Task dipakai sebagai workspace pribadi setiap anggota tim.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Area ini menampung pekerjaan yang sifatnya personal: daftar tugas, KPI, kehadiran, kalender kerja pribadi, dan pengingat harian.</p>
            <p>Tujuannya supaya user punya satu tempat yang jelas untuk mengelola ritme kerja sendiri tanpa bercampur dengan area koordinasi tim.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Cara pakai" description="Urutan paling enak untuk memulai hari dari workspace personal.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Mulai dari Tugas Saya untuk melihat prioritas utama, lalu cek Kalender Saya agar deadline, meeting, dan ritme mingguan tetap kebaca.</p>
            <p>Masuk ke Absensi saat perlu clock in/out atau mengajukan izin dan sakit, lalu pakai Reminder untuk follow up yang tidak boleh terlewat.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Batas modul" description="Task fokus ke kerja pribadi, bukan koordinasi tim besar.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Kalau kebutuhanmu menyangkut notulen rapat, action item meeting, atau pengelolaan user, area yang dipakai adalah Team.</p>
            <p>Pemisahan ini membantu user membaca mana pekerjaan milik pribadi dan mana yang memang kebutuhan tim bersama.</p>
          </div>
        </WorkspacePanel>
      </div>

      <ModuleHub
        summaryTitle="Submenu utama"
        summaryDescription="Task sekarang dibagi menjadi empat area inti untuk menjaga kerja personal tetap tertata."
        bullets={[
          "Tugas Saya dipakai untuk daftar to do dan KPI personal.",
          "Absensi dipakai untuk clock in/out serta pengajuan izin atau sakit.",
          "Kalender Saya dipakai untuk membaca ritme deadline, meeting, dan target personal.",
        ]}
        items={[
          {
            title: "Tugas Saya",
            description: "Area pribadi untuk daftar kerja aktif, prioritas, due date, dan target hasil yang ingin dicapai.",
            href: "/task/tugas-saya",
            icon: ClipboardList,
          },
          {
            title: "Absensi",
            description: "Area kehadiran personal untuk check-in, check-out, dan kebutuhan izin harian.",
            href: "/task/absensi",
            icon: Clock3,
          },
          {
            title: "KPI",
            description: "Arah cepat untuk melihat indikator hasil kerja personal yang dipantau rutin.",
            href: "/task/tugas-saya/kpi",
            icon: Gauge,
          },
          {
            title: "Kalender Saya",
            description: "Area pribadi untuk deadline, jadwal meeting, target mingguan, dan ritme kerja yang ingin dijaga.",
            href: "/task/kalender-saya",
            icon: CalendarDays,
          },
        ]}
      />
    </PageShell>
  );
}
