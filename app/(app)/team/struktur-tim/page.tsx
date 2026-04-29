import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamStructurePage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Struktur Tim"
      description="Placeholder awal untuk susunan tim, divisi, jabatan, reporting line, dan pemetaan peran internal."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk memperjelas siapa mengerjakan apa dan siapa melapor ke siapa di dalam organisasi."
        focusItems={[
          "Daftar divisi, jabatan, dan anggota yang berada di bawah masing-masing struktur kerja.",
          "Relasi reporting line agar user mudah membaca jalur koordinasi atau eskalasi.",
          "Informasi singkat per peran untuk membantu onboarding dan kejelasan tanggung jawab tim.",
        ]}
      />
    </PageShell>
  );
}
