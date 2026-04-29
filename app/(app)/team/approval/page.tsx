import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamApprovalPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Approval"
      description="Placeholder awal untuk alur persetujuan internal seperti izin, kebutuhan administratif, dan keputusan operasional."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk merapikan alur keputusan supaya persetujuan tidak lagi bergantung pada chat yang mudah hilang."
        focusItems={[
          "Daftar approval masuk, status proses, dan siapa approver yang bertanggung jawab.",
          "Jejak keputusan agar tim bisa membaca kapan sesuatu disetujui, ditolak, atau masih menunggu tindak lanjut.",
          "Filter jenis approval seperti izin, administratif, atau kebutuhan operasional lain yang nanti bertambah.",
        ]}
      />
    </PageShell>
  );
}
