import { ClipboardList, Gauge } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskMyTasksPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Tugas Saya"
      description="Overview awal untuk area kerja tugas pribadi, prioritas harian, deadline, dan progres eksekusi."
    >
      <ModuleHub
        summaryTitle="Fungsi utama"
        summaryDescription="Area ini dipakai untuk menjaga pekerjaan pribadi tetap terlihat jelas dan terukur dari hari ke hari."
        bullets={[
          "To Do dipakai untuk daftar tugas aktif, prioritas, deadline, dan blocker yang sedang dihadapi.",
          "KPI dipakai untuk membaca target personal, realisasi, dan indikator hasil kerja secara ringkas.",
        ]}
        items={[
          {
            title: "To Do",
            description: "Tempat daftar tugas aktif, prioritas, due date, dan status progres kerja pribadi.",
            href: "/task/tugas-saya/to-do",
            icon: ClipboardList,
          },
          {
            title: "KPI",
            description: "Tempat target kerja, realisasi, dan indikator performa personal yang ingin dipantau rutin.",
            href: "/task/tugas-saya/kpi",
            icon: Gauge,
          },
        ]}
      />
    </PageShell>
  );
}
