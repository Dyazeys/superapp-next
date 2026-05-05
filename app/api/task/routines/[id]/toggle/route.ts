import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError, AppError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.routines.findUnique({ where: { id } });
    invariant(existing, "Routine not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    const now = existing.is_completed ? null : new Date();

    await prisma.routines.update({
      where: { id },
      data: { is_completed: !existing.is_completed, completed_at: now },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to toggle routine.");
  }
}
