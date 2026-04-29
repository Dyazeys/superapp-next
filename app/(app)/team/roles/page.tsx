import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";
import { TeamRolesWorkspace } from "@/features/team/roles-workspace";

export default async function TeamRolesPage() {
  await requirePermission(PERMISSIONS.AUTH_ROLE_VIEW);
  return <TeamRolesWorkspace />;
}
