import "server-only";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/authz";
import { hasAnyPermission, PERMISSIONS } from "@/lib/rbac";

const TASK_ACCESS_PERMISSIONS = [
  PERMISSIONS.TASK_WORKSPACE_VIEW,
  PERMISSIONS.AUTH_USER_VIEW,
  PERMISSIONS.AUTH_ROLE_VIEW,
] as const;

const TEAM_ACCESS_PERMISSIONS = [
  PERMISSIONS.TEAM_WORKSPACE_VIEW,
  PERMISSIONS.AUTH_USER_VIEW,
  PERMISSIONS.AUTH_ROLE_VIEW,
] as const;

export async function requireTaskAccess() {
  const session = await requireAuth();

  if (!hasAnyPermission(session.user.permissions, [...TASK_ACCESS_PERMISSIONS])) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireTeamAccess() {
  const session = await requireAuth();

  if (!hasAnyPermission(session.user.permissions, [...TEAM_ACCESS_PERMISSIONS])) {
    redirect("/dashboard");
  }

  return session;
}
