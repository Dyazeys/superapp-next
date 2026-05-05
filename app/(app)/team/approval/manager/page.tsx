import { requireAuth } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TeamApprovalManagerWorkspace } from "@/features/team/approval-manager-workspace";

export default async function TeamApprovalManagerPage() {
  const session = await requireAuth();

  if (!hasPermission(session.user.permissions, PERMISSIONS.TEAM_APPROVALS_MANAGER_APPROVE)) {
    redirect("/team/approval");
  }

  return <TeamApprovalManagerWorkspace />;
}
