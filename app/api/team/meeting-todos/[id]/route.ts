import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.meeting_todos.findUnique({ where: { id } });
    invariant(existing, "Meeting todo not found.", 404);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.assignee_id !== undefined) data.assignee_id = body.assignee_id || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.due_date !== undefined) data.due_date = body.due_date ? new Date(body.due_date) : null;
    data.updated_at = new Date();

    const todo = await prisma.meeting_todos.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(todo));
  } catch (error) {
    return jsonError(error, "Failed to update meeting todo.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.meeting_todos.findUnique({ where: { id } });
    invariant(existing, "Meeting todo not found.", 404);

    await prisma.meeting_todos.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete meeting todo.");
  }
}
