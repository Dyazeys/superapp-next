import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export default async function TeamApprovalPage() {
  const session = await getServerSession(authOptions);
  const perms = session?.user?.permissions ?? [];

  if (hasPermission(perms, PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE)) {
    redirect("/team/approval/leader");
  }
  if (hasPermission(perms, PERMISSIONS.TEAM_APPROVALS_MANAGER_APPROVE)) {
    redirect("/team/approval/manager");
  }

  redirect("/dashboard");
}
