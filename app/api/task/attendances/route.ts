import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? session.user.id;
    const showAll = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};
    if (!showAll) where.user_id = userId;

    const attendances = await prisma.attendances.findMany({
      where,
      orderBy: [{ date: "desc" }],
      take: 100,
    });

    return NextResponse.json(toJsonValue(attendances));
  } catch (error) {
    return jsonError(error, "Failed to load attendance history.");
  }
}
