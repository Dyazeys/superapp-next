import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { salesOrderSchema } from "@/schemas/sales-module";

function asDateTime(value: string) {
  return new Date(value);
}

export async function GET() {
  try {
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
        master_customer: {
          select: {
            customer_id: true,
            customer_name: true,
            is_active: true,
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
  } catch (error) {
    return jsonError(error, "Failed to load sales orders.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = salesOrderSchema.parse(await request.json());

    if (payload.channel_id != null) {
      const channel = await prisma.m_channel.findUnique({
        where: { channel_id: payload.channel_id },
        select: { channel_id: true },
      });
      invariant(channel, "Channel was not found.");
    }

    if (payload.customer_id != null) {
      const customer = await prisma.master_customer.findUnique({
        where: { customer_id: payload.customer_id },
        select: {
          customer_id: true,
          is_active: true,
        },
      });
      invariant(customer, "Customer was not found.");
      invariant(customer.is_active, "Sales orders require an active customer.");
    }

    if (payload.parent_order_no) {
      invariant(payload.parent_order_no !== payload.order_no, "Parent order cannot be the same as the order.");
      const parentOrder = await prisma.t_order.findUnique({
        where: { order_no: payload.parent_order_no },
        select: { order_no: true },
      });
      invariant(parentOrder, "Parent order was not found.");
    }

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
  } catch (error) {
    return jsonError(error, "Failed to create sales order.");
  }
}
