import "server-only";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/api-error";
import { authOptions } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/rbac";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();

  if (!hasPermission(session.user.permissions, permission)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireApiPermission(permission: Permission) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AppError("Authentication required.", 401);
  }

  if (!hasPermission(session.user.permissions, permission)) {
    throw new AppError("You do not have permission to access this resource.", 403);
  }

  return session;
}

export async function requireApiAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AppError("Authentication required.", 401);
  }

  return session;
}

export function forbiddenJson(message = "You do not have permission to access this page.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
