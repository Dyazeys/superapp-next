import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TEAM_APPROVALS_ACKNOWLEDGE);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.approvals.findUnique({ where: { id } });
    invariant(existing, "Approval not found.", 404);
    invariant(existing.status === "leader_approved", "Can only acknowledge leader-approved requests.", 400);

    const approval = await prisma.approvals.update({
      where: { id },
      data: {
        status: "manager_acknowledged",
        decided_by: body.decided_by ?? session.user.id,
        decision_note: body.decision_note ?? null,
        decided_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (existing.type === "leave") {
      await prisma.leave_requests.update({
        where: { id: existing.source_id },
        data: {
          status: "manager_acknowledged",
          manager_acknowledged_at: new Date(),
          manager_acknowledged_by: session.user.id,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(toJsonValue(approval));
  } catch (error) {
    return jsonError(error, "Failed to acknowledge request.");
  }
}
