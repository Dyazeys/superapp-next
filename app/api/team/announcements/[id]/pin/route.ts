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

    const existing = await prisma.announcements.findUnique({ where: { id } });
    invariant(existing, "Announcement not found.", 404);

    const announcement = await prisma.announcements.update({
      where: { id },
      data: { is_pinned: !existing.is_pinned, updated_at: new Date() },
    });

    return NextResponse.json(toJsonValue(announcement));
  } catch (error) {
    return jsonError(error, "Failed to toggle pin.");
  }
}
