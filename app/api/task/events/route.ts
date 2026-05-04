import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { eventInputSchema } from "@/schemas/task-module";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const filterTeam = searchParams.get("filterTeam");

    const where: Record<string, unknown> = {};
    if (userId) where.creator_id = userId;
    if (filterTeam === "true") where.is_team_event = true;
    else if (filterTeam === "false") where.is_team_event = false;

    const events = await prisma.events.findMany({
      where,
      orderBy: [{ start_time: "asc" }],
    });

    return NextResponse.json(toJsonValue(events));
  } catch (error) {
    return jsonError(error, "Failed to load events.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const body = eventInputSchema.parse(await request.json());
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);

    const event = await prisma.events.create({
      data: {
        creator_id: session.user.id,
        title: body.title,
        description: body.description ?? null,
        start_time: new Date(body.start_time),
        end_time: new Date(body.end_time),
        is_team_event: body.is_team_event ?? false,
      },
    });

    return NextResponse.json(toJsonValue(event), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create event.");
  }
}
