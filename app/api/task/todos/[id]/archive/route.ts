import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError, AppError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const body = await request.json();
    const { id } = await params;

    const existing = await prisma.todos.findUnique({ where: { id } });
    invariant(existing, "Todo not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    const todo = await prisma.todos.update({
      where: { id },
      data: { is_archived: body.archived ?? !existing.is_archived, updated_at: new Date() },
    });

    return NextResponse.json(toJsonValue(todo));
  } catch (error) {
    return jsonError(error, "Failed to update archive status.");
  }
}
