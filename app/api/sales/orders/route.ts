import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { salesOrderSchema } from "@/schemas/sales-module";

function asDateTime(value: string) {
  return new Date(value);
}

export async function GET() {
  const orders = await prisma.t_order.findMany({
    orderBy: [{ order_date: "desc" }, { order_no: "desc" }],
    include: {
      m_channel: {
        select: {
          channel_id: true,
          channel_name: true,
          slug: true,
          is_marketplace: true,
        },
      },
      _count: {
        select: {
          t_order_item: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(orders));
}

export async function POST(request: NextRequest) {
  const payload = salesOrderSchema.parse(await request.json());

  const order = await prisma.t_order.create({
    data: {
      order_no: payload.order_no,
      order_date: asDateTime(payload.order_date),
      ref_no: payload.ref_no || null,
      parent_order_no: payload.parent_order_no || null,
      channel_id: payload.channel_id ?? null,
      customer_id: payload.customer_id ?? null,
      total_amount: payload.total_amount,
      status: payload.status,
      is_historical: payload.is_historical,
    },
  });

  return NextResponse.json(toJsonValue(order), { status: 201 });
}
