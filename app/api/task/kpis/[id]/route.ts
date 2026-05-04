import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.kpis.findUnique({ where: { id } });
    invariant(existing, "KPI not found.", 404);

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.type !== undefined) data.type = body.type;
    if (body.bobot !== undefined) data.bobot = body.bobot;
    if (body.target_value !== undefined) data.target_value = body.target_value;
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.period_start !== undefined) data.period_start = new Date(body.period_start);
    if (body.period_end !== undefined) data.period_end = new Date(body.period_end);
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.approval_status !== undefined) data.approval_status = body.approval_status;
    data.updated_at = new Date();

    const kpi = await prisma.kpis.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(kpi));
  } catch (error) {
    return jsonError(error, "Failed to update KPI.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.kpis.findUnique({ where: { id } });
    invariant(existing, "KPI not found.", 404);

    await prisma.kpis.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete KPI.");
  }
}
