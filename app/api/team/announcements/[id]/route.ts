import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_ANNOUNCEMENTS_UPDATE);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.announcements.findUnique({ where: { id } });
    invariant(existing, "Announcement not found.", 404);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.category !== undefined) data.category = body.category;
    data.updated_at = new Date();

    const announcement = await prisma.announcements.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(announcement));
  } catch (error) {
    return jsonError(error, "Failed to update announcement.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_ANNOUNCEMENTS_DELETE);
    const { id } = await params;

    const existing = await prisma.announcements.findUnique({ where: { id } });
    invariant(existing, "Announcement not found.", 404);

    await prisma.announcements.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete announcement.");
  }
}
