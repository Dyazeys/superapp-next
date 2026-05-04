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

    const existing = await prisma.meetings.findUnique({ where: { id } });
    invariant(existing, "Meeting not found.", 404);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.start_time !== undefined) data.start_time = body.start_time;
    if (body.end_time !== undefined) data.end_time = body.end_time;
    if (body.location !== undefined) data.location = body.location;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status !== undefined) data.status = body.status;
    if (body.participants !== undefined) data.participants = body.participants;
    data.updated_at = new Date();

    const meeting = await prisma.meetings.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(meeting));
  } catch (error) {
    return jsonError(error, "Failed to update meeting.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.meetings.findUnique({ where: { id } });
    invariant(existing, "Meeting not found.", 404);

    await prisma.meetings.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete meeting.");
  }
}
