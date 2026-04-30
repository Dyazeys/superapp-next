import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskMyTasksKpiPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="KPI"
      description="Placeholder awal untuk target personal, realisasi kerja, dan indikator hasil utama tiap anggota tim."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk merangkum target kerja personal supaya progress bukan cuma terasa sibuk, tapi juga terukur."
        focusItems={[
          "Target utama per periode, indikator hasil, dan baseline capaian yang diharapkan.",
          "Realisasi harian atau mingguan agar performa bisa dibaca cepat oleh user dan lead.",
          "Catatan gap antara target dan realisasi untuk evaluasi, coaching, atau penyesuaian ritme kerja.",
        ]}
      />
    </PageShell>
  );
}
