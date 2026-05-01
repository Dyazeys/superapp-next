import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { deletePayoutSettlementJournal, syncPayoutSettlementJournal } from "@/lib/payout-journal";
import { PERMISSIONS } from "@/lib/rbac";

type LifecycleAction = "POST" | "LOCK" | "VOID";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PAYOUT_RECORD_UPDATE);

    const { id } = await params;
    const payoutId = Number(id);
    invariant(Number.isFinite(payoutId) && payoutId > 0, "Invalid payout id.");

    const payload = (await request.json().catch(() => ({}))) as { action?: string };
    const action = String(payload.action ?? "").toUpperCase() as LifecycleAction;
    invariant(action === "POST" || action === "LOCK" || action === "VOID", "Action tidak valid.");

    const payout = await prisma.$transaction(async (tx) => {
      const current = await tx.t_payout.findUnique({
        where: { payout_id: payoutId },
        select: { payout_id: true, post_status: true, ref: true, payout_status: true },
      });
      invariant(current, "Payout was not found.");

      if (action === "POST") {
        invariant(current.post_status === "DRAFT", "Hanya payout DRAFT yang bisa di-post.");
        await syncPayoutSettlementJournal(tx, payoutId);
        await tx.t_payout.update({
          where: { payout_id: payoutId },
          data: { post_status: "POSTED", posted_at: new Date(), voided_at: null },
        });
      }

      if (action === "LOCK") {
        invariant(current.post_status === "POSTED", "Hanya payout POSTED yang bisa di-lock.");
        await tx.t_payout.update({
          where: { payout_id: payoutId },
          data: { post_status: "LOCKED", locked_at: new Date() },
        });
      }

      if (action === "VOID") {
        invariant(
          current.post_status === "POSTED" || current.post_status === "LOCKED",
          "Hanya payout POSTED/LOCKED yang bisa di-void."
        );
        await deletePayoutSettlementJournal(tx, payoutId);
        await tx.t_payout.update({
          where: { payout_id: payoutId },
          data: { post_status: "VOID", voided_at: new Date() },
        });
      }

      return tx.t_payout.findUniqueOrThrow({
        where: { payout_id: payoutId },
        include: {
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

    return NextResponse.json(toJsonValue(payout));
  } catch (error) {
    return jsonError(error, "Failed to change payout lifecycle.");
  }
}
