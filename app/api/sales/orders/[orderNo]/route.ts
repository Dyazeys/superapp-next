import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { removeSalesOrderItemMovements, syncSalesOrderMovements } from "@/lib/warehouse-stock";
import { salesOrderSchema } from "@/schemas/sales-module";

function asDateTime(value: string) {
  return new Date(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params;
    const payload = salesOrderSchema.partial().parse(await request.json());

    if (payload.channel_id != null) {
      const channel = await prisma.m_channel.findUnique({
        where: { channel_id: payload.channel_id },
        select: { channel_id: true },
      });
      invariant(channel, "Channel was not found.");
    }

    if (payload.parent_order_no) {
      invariant(payload.parent_order_no !== orderNo, "Parent order cannot be the same as the order.");
      const parentOrder = await prisma.t_order.findUnique({
        where: { order_no: payload.parent_order_no },
        select: { order_no: true },
      });
      invariant(parentOrder, "Parent order was not found.");
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.t_order.update({
        where: { order_no: orderNo },
        data: {
          order_date: payload.order_date === undefined ? undefined : asDateTime(payload.order_date),
          ref_no: payload.ref_no === undefined ? undefined : payload.ref_no || null,
          parent_order_no: payload.parent_order_no === undefined ? undefined : payload.parent_order_no || null,
          channel_id: payload.channel_id === undefined ? undefined : payload.channel_id ?? null,
          customer_id: payload.customer_id === undefined ? undefined : payload.customer_id ?? null,
          total_amount: payload.total_amount,
          status: payload.status,
          is_historical: payload.is_historical,
        },
      });

      if (payload.order_date !== undefined || payload.is_historical !== undefined) {
        await syncSalesOrderMovements(tx, orderNo);
      }

      return updated;
    });

    return NextResponse.json(toJsonValue(order));
  } catch (error) {
    return jsonError(error, "Failed to update sales order.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params;

    await prisma.$transaction(async (tx) => {
      const items = await tx.t_order_item.findMany({
        where: { order_no: orderNo },
        select: { id: true },
      });

      for (const item of items) {
        await removeSalesOrderItemMovements(tx, item.id);
      }

      await tx.t_order_item.deleteMany({
        where: { order_no: orderNo },
      });

      await tx.t_order.delete({
        where: { order_no: orderNo },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete sales order.");
  }
}
