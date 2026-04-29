import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamMeetingNotesPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Notulen"
      description="Placeholder awal untuk catatan meeting, rangkuman pembahasan, dan keputusan hasil diskusi tim."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk mencatat jalannya meeting dengan istilah notulen yang memang sudah akrab dipakai tim sehari-hari."
        focusItems={[
          "Judul meeting, tanggal, peserta, dan agenda pembahasan.",
          "Catatan diskusi, keputusan utama, dan poin yang perlu di-follow up setelah rapat.",
          "Relasi ke To Do supaya action item bisa lahir langsung dari notulen meeting yang sama.",
        ]}
      />
    </PageShell>
  );
}
