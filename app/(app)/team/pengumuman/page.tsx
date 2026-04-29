import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamAnnouncementsPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Pengumuman"
      description="Placeholder awal untuk komunikasi internal, update operasional, dan informasi yang perlu dilihat banyak anggota tim."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai sebagai kanal informasi bersama supaya update penting tidak tercecer di chat."
        focusItems={[
          "Pengumuman operasional, perubahan jadwal, dan info penting dari leader atau admin.",
          "Pembaruan SOP, kebijakan internal, atau arahan kerja yang perlu diketahui banyak orang.",
          "Status baca atau prioritas info agar tim bisa membedakan mana yang sekadar update dan mana yang harus segera ditindaklanjuti.",
        ]}
      />
    </PageShell>
  );
}
