import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
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
    const { id } = await params;
    const payload = payoutAdjustmentSchema.partial().parse(await request.json());

    if (payload.ref) {
      const order = await prisma.t_order.findFirst({
        where: { ref_no: payload.ref },
        select: { ref_no: true },
      });
      invariant(order, "Sales reference was not found.");
    }

    if (payload.channel_id != null) {
      const channel = await prisma.m_channel.findUnique({
        where: { channel_id: payload.channel_id },
        select: { channel_id: true },
      });
      invariant(channel, "Channel was not found.");
    }

    const adjustment = await prisma.t_adjustments.update({
      where: { adjustment_id: Number(id) },
      data: {
        ref: payload.ref === undefined ? undefined : payload.ref || null,
        payout_date: payload.payout_date === undefined ? undefined : asDateOnly(payload.payout_date),
        adjustment_date:
          payload.adjustment_date === undefined
            ? undefined
            : payload.adjustment_date
              ? asDateOnly(payload.adjustment_date)
              : null,
        channel_id: payload.channel_id === undefined ? undefined : payload.channel_id ?? null,
        adjustment_type: payload.adjustment_type === undefined ? undefined : payload.adjustment_type || null,
        reason: payload.reason === undefined ? undefined : payload.reason || null,
        amount: payload.amount,
      },
      include: {
        m_channel: {
          select: payoutChannelSelect,
        },
        t_order: {
          select: payoutOrderSelect,
        },
      },
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
    const { id } = await params;

    await prisma.t_adjustments.delete({
      where: { adjustment_id: Number(id) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete payout adjustment.");
  }
}
