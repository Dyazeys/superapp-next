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

    const existing = await prisma.todos.findUnique({ where: { id } });
    invariant(existing, "Todo not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.assignee_id !== undefined) data.assignee_id = body.assignee_id || null;
    if (body.due_date !== undefined) data.due_date = body.due_date ? new Date(body.due_date) : null;
    if (body.started_at !== undefined) data.started_at = body.started_at ? new Date(body.started_at) : null;
    if (body.is_archived !== undefined) data.is_archived = body.is_archived;
    data.updated_at = new Date();

    const todo = await prisma.todos.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(todo));
  } catch (error) {
    return jsonError(error, "Failed to update todo.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.todos.findUnique({ where: { id } });
    invariant(existing, "Todo not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    await prisma.todos.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete todo.");
  }
}
