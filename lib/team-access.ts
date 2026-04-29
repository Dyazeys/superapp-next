import "server-only";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/authz";
import { hasAnyPermission, PERMISSIONS } from "@/lib/rbac";

const TEAM_ACCESS_PERMISSIONS = [
  PERMISSIONS.AUTH_USER_VIEW,
  PERMISSIONS.AUTH_ROLE_VIEW,
] as const;

export async function requireTeamAccess() {
  const session = await requireAuth();

  if (!hasAnyPermission(session.user.permissions, [...TEAM_ACCESS_PERMISSIONS])) {
    redirect("/dashboard");
  }

  return session;
}
