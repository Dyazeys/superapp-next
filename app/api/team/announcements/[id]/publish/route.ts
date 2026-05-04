import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_ANNOUNCEMENTS_PUBLISH);
    const { id } = await params;

    const existing = await prisma.announcements.findUnique({ where: { id } });
    invariant(existing, "Announcement not found.", 404);

    const newStatus = existing.status === "draft" ? "pending" : existing.status;

    const announcement = await prisma.announcements.update({
      where: { id },
      data: { status: newStatus, updated_at: new Date() },
    });

    return NextResponse.json(toJsonValue(announcement));
  } catch (error) {
    return jsonError(error, "Failed to publish announcement.");
  }
}
