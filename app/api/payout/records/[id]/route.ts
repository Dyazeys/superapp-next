import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { deletePayoutSettlementJournal, syncPayoutSettlementJournal } from "@/lib/payout-journal";
import { normalizePayoutStatus } from "@/lib/payout-status";
import { payoutPatchSchema } from "@/schemas/payout-module";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawPayload = await request.json();
    const payload = payoutPatchSchema.parse(rawPayload);
    const has = (key: string) => Object.prototype.hasOwnProperty.call(rawPayload, key);
    const payoutId = Number(id);

    const payout = await prisma.$transaction(async (tx) => {
      if (payload.ref) {
        const order = await tx.t_order.findFirst({
          where: { ref_no: payload.ref },
          select: { ref_no: true },
        });
        invariant(order, "Sales reference was not found.");
      }

      await tx.t_payout.update({
        where: { payout_id: payoutId },
        data: {
          ref: has("ref") ? payload.ref || null : undefined,
          payout_date: has("payout_date") ? (payload.payout_date ? asDateOnly(payload.payout_date) : undefined) : undefined,
          qty_produk: has("qty_produk") ? payload.qty_produk : undefined,
          hpp: has("hpp") ? payload.hpp : undefined,
          total_price: has("total_price") ? payload.total_price : undefined,
          seller_discount: has("seller_discount") ? payload.seller_discount : undefined,
          fee_admin: has("fee_admin") ? payload.fee_admin : undefined,
          fee_service: has("fee_service") ? payload.fee_service : undefined,
          fee_order_process: has("fee_order_process") ? payload.fee_order_process : undefined,
          fee_program: has("fee_program") ? payload.fee_program : undefined,
          fee_affiliate: has("fee_affiliate") ? payload.fee_affiliate : undefined,
          shipping_cost: has("shipping_cost") ? payload.shipping_cost : undefined,
          omset: has("omset") ? payload.omset : undefined,
          payout_status: has("payout_status")
            ? (normalizePayoutStatus(payload.payout_status) ?? "SETTLED")
            : undefined,
        },
      });

      await syncPayoutSettlementJournal(tx, payoutId);

      return tx.t_payout.findUniqueOrThrow({
        where: { payout_id: payoutId },
        include: {
          t_order: {
            select: payoutOrderSelect,
          },
        },
      });
    });

    return NextResponse.json(toJsonValue(payout));
  } catch (error) {
    return jsonError(error, "Failed to update payout.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payoutId = Number(id);

    await prisma.$transaction(async (tx) => {
      await deletePayoutSettlementJournal(tx, payoutId);

      await tx.t_payout.delete({
        where: { payout_id: payoutId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete payout.");
  }
}
