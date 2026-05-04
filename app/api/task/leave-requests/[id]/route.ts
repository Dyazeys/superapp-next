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

    const existing = await prisma.leave_requests.findUnique({ where: { id } });
    invariant(existing, "Leave request not found.", 404);
    invariant(existing.status === "pending", "Can only edit pending requests.", 400);

    const data: Record<string, unknown> = {};
    if (body.type !== undefined) data.type = body.type;
    if (body.category !== undefined) data.category = body.category;
    if (body.start_date !== undefined) data.start_date = new Date(body.start_date);
    if (body.end_date !== undefined) data.end_date = new Date(body.end_date);
    if (body.time_value !== undefined) data.time_value = body.time_value;
    if (body.reason !== undefined) data.reason = body.reason;
    if (body.attachment_url !== undefined) data.attachment_url = body.attachment_url;
    data.updated_at = new Date();

    if (data.start_date && data.end_date) {
      const s = data.start_date as Date;
      const e = data.end_date as Date;
      data.total_days = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }

    const leave = await prisma.leave_requests.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(leave));
  } catch (error) {
    return jsonError(error, "Failed to update leave request.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.leave_requests.findUnique({ where: { id } });
    invariant(existing, "Leave request not found.", 404);
    invariant(existing.status === "pending", "Can only cancel pending requests.", 400);

    await prisma.leave_requests.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to cancel leave request.");
  }
}
