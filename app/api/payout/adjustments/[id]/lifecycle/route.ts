import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { deletePayoutAdjustmentJournal, syncPayoutAdjustmentJournal } from "@/lib/payout-adjustment-journal";
import { PERMISSIONS } from "@/lib/rbac";

type LifecycleAction = "POST" | "LOCK" | "VOID";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PAYOUT_ADJUSTMENT_UPDATE);

    const { id } = await params;
    const adjustmentId = Number(id);
    invariant(Number.isFinite(adjustmentId) && adjustmentId > 0, "Invalid adjustment id.");

    const payload = (await request.json().catch(() => ({}))) as { action?: string };
    const action = String(payload.action ?? "").toUpperCase() as LifecycleAction;
    invariant(action === "POST" || action === "LOCK" || action === "VOID", "Action tidak valid.");

    const adjustment = await prisma.$transaction(async (tx) => {
      const current = await tx.t_adjustments.findUnique({
        where: { adjustment_id: adjustmentId },
        select: { adjustment_id: true, post_status: true },
      });
      invariant(current, "Adjustment was not found.");

      if (action === "POST") {
        invariant(current.post_status === "DRAFT", "Hanya adjustment DRAFT yang bisa di-post.");
        await syncPayoutAdjustmentJournal(tx, adjustmentId);
        await tx.t_adjustments.update({
          where: { adjustment_id: adjustmentId },
          data: { post_status: "POSTED", posted_at: new Date(), voided_at: null },
        });
      }

      if (action === "LOCK") {
        invariant(current.post_status === "POSTED", "Hanya adjustment POSTED yang bisa di-lock.");
        await tx.t_adjustments.update({
          where: { adjustment_id: adjustmentId },
          data: { post_status: "LOCKED", locked_at: new Date() },
        });
      }

      if (action === "VOID") {
        invariant(
          current.post_status === "POSTED" || current.post_status === "LOCKED",
          "Hanya adjustment POSTED/LOCKED yang bisa di-void."
        );
        await deletePayoutAdjustmentJournal(tx, adjustmentId);
        await tx.t_adjustments.update({
          where: { adjustment_id: adjustmentId },
          data: { post_status: "VOID", voided_at: new Date() },
        });
      }

      return tx.t_adjustments.findUniqueOrThrow({
        where: { adjustment_id: adjustmentId },
        include: {
          m_channel: {
            select: {
              channel_id: true,
              channel_name: true,
              slug: true,
              is_marketplace: true,
            },
          },
          t_order: {
            select: {
              order_no: true,
              order_date: true,
              ref_no: true,
              total_amount: true,
              status: true,
              channel_id: true,
              m_channel: {
                select: {
                  channel_id: true,
                  channel_name: true,
                  slug: true,
                  is_marketplace: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(toJsonValue(adjustment));
  } catch (error) {
    return jsonError(error, "Failed to change adjustment lifecycle.");
  }
}
