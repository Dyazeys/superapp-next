import { requireAuth } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TeamApprovalLeaderWorkspace } from "@/features/team/approval-leader-workspace";

export default async function TeamApprovalLeaderPage() {
  const session = await requireAuth();

  if (!hasPermission(session.user.permissions, PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE)) {
    redirect("/team/approval");
  }

  return <TeamApprovalLeaderWorkspace />;
}
