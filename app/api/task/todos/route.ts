import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { todoInputSchema } from "@/schemas/task-module";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const archived = searchParams.get("archived");

    const where: Record<string, unknown> = {};
    if (userId) where.user_id = userId;
    if (status) where.status = status;
    if (archived === "true") where.is_archived = true;
    else if (archived !== "all") where.is_archived = false;

    const todos = await prisma.todos.findMany({
      where,
      orderBy: [{ created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(todos));
  } catch (error) {
    return jsonError(error, "Failed to load todos.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const body = todoInputSchema.parse(await request.json());
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    invariant(userId, "userId is required.");

    const todo = await prisma.todos.create({
      data: {
        user_id: userId,
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "backlog",
        priority: body.priority ?? "medium",
        assignee_id: body.assignee_id ?? null,
        due_date: body.due_date ? new Date(body.due_date) : null,
      },
    });

    return NextResponse.json(toJsonValue(todo), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create todo.");
  }
}
