import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";
import { TeamUsersWorkspace } from "@/features/team/users-workspace";

export default async function TeamUsersPage() {
  await requirePermission(PERMISSIONS.AUTH_USER_VIEW);
  return <TeamUsersWorkspace />;
}
