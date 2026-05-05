import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { leaveRequestInputSchema } from "@/schemas/task-module";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? session.user.id;
    const showAll = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};
    if (!showAll) where.user_id = userId;

    const leaves = await prisma.leave_requests.findMany({
      where,
      orderBy: [{ created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(leaves));
  } catch (error) {
    return jsonError(error, "Failed to load leave requests.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const body = leaveRequestInputSchema.parse(await request.json());
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);

    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const leave = await prisma.leave_requests.create({
      data: {
        user_id: session.user.id,
        type: body.type,
        category: body.category,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        time_value: body.time_value ?? null,
        reason: body.reason,
        attachment_url: body.attachment_url ?? null,
      },
    });

    await prisma.approvals.create({
      data: {
        type: "leave",
        source_id: leave.id,
        requester_id: session.user.id,
        title: `${body.type === "izin_direncanakan" ? "Izin Direncanakan" : "Izin Mendesak"} — ${body.reason.slice(0, 200)}`,
        status: "pending",
      },
    });

    return NextResponse.json(toJsonValue(leave), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create leave request.");
  }
}
