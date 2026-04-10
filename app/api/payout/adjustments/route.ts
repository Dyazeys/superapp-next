import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { resolvePayoutAdjustmentChannelId } from "@/lib/payout-adjustment-channel";
import { toJsonValue } from "@/lib/json";
import { syncPayoutAdjustmentJournal } from "@/lib/payout-adjustment-journal";
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

export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get("ref");

    const adjustments = await prisma.t_adjustments.findMany({
      where: ref ? { ref } : undefined,
      orderBy: [{ payout_date: "desc" }, { adjustment_date: "desc" }, { adjustment_id: "desc" }],
      include: {
        m_channel: {
          select: payoutChannelSelect,
        },
        t_order: {
          select: payoutOrderSelect,
        },
      },
    });

    return NextResponse.json(toJsonValue(adjustments));
  } catch (error) {
    return jsonError(error, "Failed to load payout adjustments.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = payoutAdjustmentSchema.parse(await request.json());

    const adjustment = await prisma.$transaction(async (tx) => {
      const resolvedChannelId = await resolvePayoutAdjustmentChannelId(tx, {
        channelId: payload.channel_id ?? null,
        ref: payload.ref ?? null,
        marketplace: payload.marketplace ?? null,
        post: payload.post ?? null,
      });

      const created = await tx.t_adjustments.create({
        data: {
          ref: payload.ref || null,
          payout_date: asDateOnly(payload.payout_date),
          adjustment_date: payload.adjustment_date ? asDateOnly(payload.adjustment_date) : null,
          channel_id: resolvedChannelId,
          adjustment_type: payload.adjustment_type || null,
          reason: payload.reason || null,
          amount: payload.amount,
        },
      });

      await syncPayoutAdjustmentJournal(tx, created.adjustment_id);

      return tx.t_adjustments.findUniqueOrThrow({
        where: { adjustment_id: created.adjustment_id },
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

    return NextResponse.json(toJsonValue(adjustment), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create payout adjustment.");
  }
}
