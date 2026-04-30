import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskMyTasksTodoPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="To Do"
      description="Placeholder awal untuk daftar tugas aktif, prioritas harian, dan progres eksekusi personal."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk menjaga tugas pribadi tetap fokus, terurut, dan gampang dipantau setiap hari."
        focusItems={[
          "Daftar tugas aktif beserta prioritas, deadline, dan status progresnya.",
          "Catatan blocker, reminder, dan tindak lanjut yang perlu segera dilakukan.",
          "Filter per proyek, divisi, atau hasil meeting yang sudah berubah menjadi action item.",
        ]}
      />
    </PageShell>
  );
}
