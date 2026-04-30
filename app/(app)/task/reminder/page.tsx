import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskReminderPage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Reminder"
      description="Placeholder awal untuk pengingat follow up, pekerjaan sensitif terhadap waktu, dan item yang tidak boleh terlewat."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk membantu user menjaga follow up penting tetap muncul di waktu yang tepat."
        focusItems={[
          "Reminder tugas, approval, atau follow up meeting yang punya batas waktu jelas.",
          "Pengingat berulang untuk aktivitas harian, mingguan, atau periodik yang sifatnya rutin.",
          "Status reminder yang sudah dibaca, ditunda, atau selesai supaya fokus tetap terjaga.",
        ]}
      />
    </PageShell>
  );
}
