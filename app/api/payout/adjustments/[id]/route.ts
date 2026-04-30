import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { resolvePayoutAdjustmentChannelId } from "@/lib/payout-adjustment-channel";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { deletePayoutAdjustmentJournal, syncPayoutAdjustmentJournal } from "@/lib/payout-adjustment-journal";
import { payoutAdjustmentSchema } from "@/schemas/payout-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

const payoutOrderSelect = {
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
} as const;

const payoutChannelSelect = {
  channel_id: true,
  channel_name: true,
  slug: true,
  is_marketplace: true,
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PAYOUT_ADJUSTMENT_UPDATE);

    const { id } = await params;
    const payload = payoutAdjustmentSchema.partial().parse(await request.json());
    const adjustmentId = Number(id);

    const adjustment = await prisma.$transaction(async (tx) => {
      const current = await tx.t_adjustments.findUniqueOrThrow({
        where: { adjustment_id: adjustmentId },
        select: {
          ref: true,
          channel_id: true,
        },
      });

      const resolvedChannelId = await resolvePayoutAdjustmentChannelId(tx, {
        channelId: payload.channel_id === undefined ? current.channel_id : payload.channel_id,
        ref: payload.ref === undefined ? current.ref : payload.ref,
        marketplace: payload.marketplace ?? null,
        post: payload.post ?? null,
      });

      await tx.t_adjustments.update({
        where: { adjustment_id: adjustmentId },
        data: {
          ref: payload.ref === undefined ? undefined : payload.ref || null,
          payout_date: payload.payout_date === undefined ? undefined : asDateOnly(payload.payout_date),
          adjustment_date:
            payload.adjustment_date === undefined
              ? undefined
              : payload.adjustment_date
                ? asDateOnly(payload.adjustment_date)
                : null,
          channel_id: resolvedChannelId,
          adjustment_type: payload.adjustment_type === undefined ? undefined : payload.adjustment_type || null,
          reason: payload.reason === undefined ? undefined : payload.reason || null,
          amount: payload.amount,
        },
      });

      await syncPayoutAdjustmentJournal(tx, adjustmentId);

      return tx.t_adjustments.findUniqueOrThrow({
        where: { adjustment_id: adjustmentId },
        include: {
          m_channel: {
            select: payoutChannelSelect,
          },
          t_order: {
            select: payoutOrderSelect,
          },
        },
      });
    });

    return NextResponse.json(toJsonValue(adjustment));
  } catch (error) {
    return jsonError(error, "Failed to update payout adjustment.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PAYOUT_ADJUSTMENT_DELETE);

    const { id } = await params;
    const adjustmentId = Number(id);

    await prisma.$transaction(async (tx) => {
      await deletePayoutAdjustmentJournal(tx, adjustmentId);

      await tx.t_adjustments.delete({
        where: { adjustment_id: adjustmentId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete payout adjustment.");
  }
}
