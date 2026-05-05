import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError, AppError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.routines.findUnique({ where: { id } });
    invariant(existing, "Routine not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    data.updated_at = new Date();

    const routine = await prisma.routines.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(routine));
  } catch (error) {
    return jsonError(error, "Failed to update routine.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.routines.findUnique({ where: { id } });
    invariant(existing, "Routine not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    await prisma.routines.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete routine.");
  }
}
