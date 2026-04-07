import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { deletePayoutSettlementJournal, syncPayoutSettlementJournal } from "@/lib/payout-journal";
import { payoutSchema } from "@/schemas/payout-module";

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
    const payload = payoutSchema.partial().parse(await request.json());
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
          ref: payload.ref === undefined ? undefined : payload.ref || null,
          payout_date: payload.payout_date === undefined ? undefined : asDateOnly(payload.payout_date),
          qty_produk: payload.qty_produk,
          hpp: payload.hpp,
          total_price: payload.total_price,
          seller_discount: payload.seller_discount,
          fee_admin: payload.fee_admin,
          fee_service: payload.fee_service,
          fee_order_process: payload.fee_order_process,
          fee_program: payload.fee_program,
          fee_transaction: payload.fee_transaction,
          fee_affiliate: payload.fee_affiliate,
          shipping_cost: payload.shipping_cost,
          omset: payload.omset,
          payout_status: payload.payout_status === undefined ? undefined : payload.payout_status || null,
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
