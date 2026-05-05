import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.kpis.findUnique({ where: { id } });
    invariant(existing, "KPI not found.", 404);

    const kpi = await prisma.kpis.update({
      where: { id },
      data: { approval_status: "approved", updated_at: new Date() },
    });

    return NextResponse.json(toJsonValue(kpi));
  } catch (error) {
    return jsonError(error, "Failed to approve KPI.");
  }
}
