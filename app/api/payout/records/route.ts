import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { syncPayoutSettlementJournal } from "@/lib/payout-journal";
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

export async function GET() {
  try {
    const payouts = await prisma.t_payout.findMany({
      orderBy: [{ payout_date: "desc" }, { payout_id: "desc" }],
      include: {
        t_order: {
          select: payoutOrderSelect,
        },
      },
    });

    return NextResponse.json(toJsonValue(payouts));
  } catch (error) {
    return jsonError(error, "Failed to load payouts.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = payoutSchema.parse(await request.json());

    const payout = await prisma.$transaction(async (tx) => {
      if (payload.ref) {
        const order = await tx.t_order.findFirst({
          where: { ref_no: payload.ref },
          select: { ref_no: true },
        });
        invariant(order, "Sales reference was not found.");
      }

      const created = await tx.t_payout.create({
        data: {
          ref: payload.ref || null,
          payout_date: asDateOnly(payload.payout_date),
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
          payout_status: payload.payout_status || null,
        },
      });

      await syncPayoutSettlementJournal(tx, created.payout_id);

      return tx.t_payout.findUniqueOrThrow({
        where: { payout_id: created.payout_id },
        include: {
          t_order: {
            select: payoutOrderSelect,
          },
        },
      });
    });

    return NextResponse.json(toJsonValue(payout), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create payout.");
  }
}
