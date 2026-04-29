import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";
import { TeamUserProfileWorkspace } from "@/features/team/user-profile-workspace";

export default async function TeamUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.AUTH_USER_VIEW);
  const { id } = await params;

  return <TeamUserProfileWorkspace userId={id} />;
}
