import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { meetingInputSchema } from "@/schemas/task-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_MEETINGS_VIEW);

    const meetings = await prisma.meetings.findMany({
      orderBy: [{ date: "desc" }, { start_time: "asc" }],
    });

    return NextResponse.json(toJsonValue(meetings));
  } catch (error) {
    return jsonError(error, "Failed to load meetings.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TEAM_MEETINGS_CREATE);
    const body = meetingInputSchema.parse(await request.json());

    const meeting = await prisma.meetings.create({
      data: {
        organizer_id: session.user.id,
        title: body.title,
        date: new Date(body.date),
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location ?? null,
        notes: body.notes ?? null,
        participants: body.participants ?? [],
      },
    });

    return NextResponse.json(toJsonValue(meeting), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create meeting.");
  }
}
