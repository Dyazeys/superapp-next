import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.events.findUnique({ where: { id } });
    invariant(existing, "Event not found.", 404);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.start_time !== undefined) data.start_time = new Date(body.start_time);
    if (body.end_time !== undefined) data.end_time = new Date(body.end_time);
    if (body.is_team_event !== undefined) data.is_team_event = body.is_team_event;
    data.updated_at = new Date();

    const event = await prisma.events.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(event));
  } catch (error) {
    return jsonError(error, "Failed to update event.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.events.findUnique({ where: { id } });
    invariant(existing, "Event not found.", 404);

    await prisma.events.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete event.");
  }
}
