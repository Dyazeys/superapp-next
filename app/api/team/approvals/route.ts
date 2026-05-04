import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_APPROVALS_VIEW);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const approvals = await prisma.approvals.findMany({
      where,
      orderBy: [{ created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(approvals));
  } catch (error) {
    return jsonError(error, "Failed to load approvals.");
  }
}
