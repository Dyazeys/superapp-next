import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError, AppError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { kpiRealizationSchema } from "@/schemas/task-module";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;
    const body = kpiRealizationSchema.parse(await request.json());

    const existing = await prisma.kpis.findUnique({ where: { id } });
    invariant(existing, "KPI not found.", 404);
    if (existing.user_id !== session.user.id) throw new AppError("Forbidden", 403);

    const kpi = await prisma.kpis.update({
      where: { id },
      data: {
        realization_value: body.realization_value,
        approval_status: "pending",
        updated_at: new Date(),
      },
    });

    return NextResponse.json(toJsonValue(kpi));
  } catch (error) {
    return jsonError(error, "Failed to update realization.");
  }
}
