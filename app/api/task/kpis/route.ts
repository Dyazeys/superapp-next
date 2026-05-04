import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { kpiTeamInputSchema } from "@/schemas/task-module";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (userId) where.user_id = userId;

    const kpis = await prisma.kpis.findMany({
      where,
      orderBy: [{ period_start: "desc" }, { created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(kpis));
  } catch (error) {
    return jsonError(error, "Failed to load KPIs.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const body = kpiTeamInputSchema.parse(await request.json());

    const kpi = await prisma.kpis.create({
      data: {
        user_id: body.user_id,
        title: body.title,
        description: body.description ?? null,
        type: body.type,
        bobot: body.bobot,
        target_value: body.target_value,
        unit: body.unit,
        period_start: new Date(body.period_start),
        period_end: new Date(body.period_end),
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(toJsonValue(kpi), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create KPI.");
  }
}
