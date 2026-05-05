import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.approvals.findUnique({ where: { id } });
    invariant(existing, "Approval not found.", 404);

    const LEADER_TYPES = ["sales_order", "inbound", "warehouse_adjustment", "leave"];
    const MANAGER_TYPES = ["opex", "opex_barter"];

    const requiredPermission = LEADER_TYPES.includes(existing.type)
      ? PERMISSIONS.TEAM_APPROVALS_LEADER_REJECT
      : MANAGER_TYPES.includes(existing.type)
        ? PERMISSIONS.TEAM_APPROVALS_MANAGER_REJECT
        : PERMISSIONS.TEAM_APPROVALS_LEADER_REJECT;

    const session = await requireApiPermission(requiredPermission);

    const approval = await prisma.$transaction(async (tx) => {
      const updated = await tx.approvals.update({
        where: { id },
        data: {
          status: "rejected",
          decided_by: body.decided_by ?? session.user.id,
          decision_note: body.decision_note ?? null,
          decided_at: new Date(),
          updated_at: new Date(),
        },
      });

      if (existing.type === "leave") {
        await tx.leave_requests.update({
          where: { id: existing.source_id },
          data: { status: "rejected", updated_at: new Date() },
        });
      }

      return updated;
    });

    return NextResponse.json(toJsonValue(approval));
  } catch (error) {
    return jsonError(error, "Failed to reject request.");
  }
}
