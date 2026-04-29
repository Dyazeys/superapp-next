import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamSopPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="SOP"
      description="Placeholder awal untuk standar operasional, guideline kerja, dan dokumentasi proses yang dipakai bersama."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai sebagai rumah utama SOP supaya panduan kerja tim mudah dicari dan tidak tercecer."
        focusItems={[
          "Dokumen SOP per area kerja, lengkap dengan versi, pemilik dokumen, dan tanggal pembaruan.",
          "Template kerja atau checklist proses untuk membantu eksekusi yang lebih konsisten.",
          "Catatan perubahan SOP agar tim tahu mana proses yang baru, direvisi, atau sudah tidak dipakai lagi.",
        ]}
      />
    </PageShell>
  );
}
