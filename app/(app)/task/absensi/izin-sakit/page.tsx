import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";
import { requireTaskAccess } from "@/lib/team-access";

export default async function TaskAttendanceLeavePage() {
  await requireTaskAccess();

  return (
    <PageShell
      eyebrow="Task"
      title="Izin / Sakit"
      description="Placeholder awal untuk pengajuan izin, sakit, approval, dan riwayat permohonan."
    >
      <ModulePlaceholder
        intro="Halaman ini akan dipakai untuk kebutuhan administratif saat anggota perlu izin, cuti singkat, atau melapor sakit."
        focusItems={[
          "Form pengajuan izin atau sakit dengan rentang tanggal dan alasan.",
          "Upload lampiran seperti surat dokter atau bukti pendukung lain bila diperlukan.",
          "Status approval, siapa approver-nya, dan histori permohonan yang pernah diajukan.",
        ]}
      />
    </PageShell>
  );
}
