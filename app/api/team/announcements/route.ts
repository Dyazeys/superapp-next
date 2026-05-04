import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { announcementInputSchema } from "@/schemas/task-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_ANNOUNCEMENTS_VIEW);

    const announcements = await prisma.announcements.findMany({
      orderBy: [{ is_pinned: "desc" }, { created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(announcements));
  } catch (error) {
    return jsonError(error, "Failed to load announcements.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TEAM_ANNOUNCEMENTS_CREATE);
    const body = announcementInputSchema.parse(await request.json());

    const announcement = await prisma.announcements.create({
      data: {
        author_id: session.user.id,
        title: body.title,
        content: body.content,
        category: body.category,
        is_pinned: body.is_pinned ?? false,
      },
    });

    return NextResponse.json(toJsonValue(announcement), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create announcement.");
  }
}
