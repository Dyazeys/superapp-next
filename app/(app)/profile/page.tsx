import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

export default function ProfilePage() {
  return (
    <PageShell
      eyebrow="Profile"
      title="Edit Profile"
      description="Kelola data profil user untuk kebutuhan identitas akun."
    >
      <WorkspacePanel title="Profile settings" description="Halaman edit profile siap dipakai untuk update data user.">
        <p className="text-sm text-slate-600">
          Silakan lanjutkan implementasi field profil sesuai kebutuhan (nama, email, avatar, dan password).
        </p>
      </WorkspacePanel>
    </PageShell>
  );
}
