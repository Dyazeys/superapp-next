import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { routineInputSchema } from "@/schemas/task-module";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? session.user.id;
    const showAll = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};
    if (!showAll) where.user_id = userId;

    const routines = await prisma.routines.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });

    return NextResponse.json(toJsonValue(routines));
  } catch (error) {
    return jsonError(error, "Failed to load routines.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const body = routineInputSchema.parse(await request.json());
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    invariant(userId, "userId is required.");

    const maxSort = await prisma.routines.findFirst({
      where: { user_id: userId },
      orderBy: [{ sort_order: "desc" }],
      select: { sort_order: true },
    });

    const routine = await prisma.routines.create({
      data: {
        user_id: userId,
        title: body.title,
        description: body.description ?? null,
        sort_order: (maxSort?.sort_order ?? -1) + 1,
      },
    });

    return NextResponse.json(toJsonValue(routine), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create routine.");
  }
}
