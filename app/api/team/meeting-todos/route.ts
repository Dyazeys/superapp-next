import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { meetingTodoInputSchema } from "@/schemas/task-module";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meeting_id");
    const assigneeId = searchParams.get("assignee_id");

    const where: Record<string, unknown> = {};
    if (meetingId) where.meeting_id = meetingId;
    if (assigneeId) where.assignee_id = assigneeId;

    const todos = await prisma.meeting_todos.findMany({
      where,
      orderBy: [{ created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(todos));
  } catch (error) {
    return jsonError(error, "Failed to load meeting todos.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const body = meetingTodoInputSchema.parse(await request.json());

    const meeting = await prisma.meetings.findUnique({ where: { id: body.meeting_id.toString() } });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    const todo = await prisma.meeting_todos.create({
      data: {
        meeting_id: body.meeting_id.toString(),
        title: body.title,
        description: body.description ?? null,
        assignee_id: body.assignee_id ?? null,
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        due_date: body.due_date ? new Date(body.due_date) : null,
      },
    });

    return NextResponse.json(toJsonValue(todo), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create meeting todo.");
  }
}
