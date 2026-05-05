import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { deleteSalesOrderItemJournal, syncSalesOrderJournals } from "@/lib/sales-journal";
import { removeSalesOrderItemMovements, syncSalesOrderMovements } from "@/lib/warehouse-stock";
import { salesOrderPatchSchema } from "@/schemas/sales-module";

function asDateTime(value: string) {
  return new Date(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const session = await requireApiPermission(PERMISSIONS.SALES_ORDER_UPDATE);
    const createdBy = session.user.username;

    const { orderNo } = await params;
    const rawPayload = await request.json();
    const payload = salesOrderPatchSchema.parse(rawPayload);
    const has = (key: string) => Object.prototype.hasOwnProperty.call(rawPayload, key);

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
          order_date: has("order_date") ? (payload.order_date ? asDateTime(payload.order_date) : undefined) : undefined,
          ref_no: has("ref_no") ? payload.ref_no || null : undefined,
          parent_order_no: has("parent_order_no") ? payload.parent_order_no || null : undefined,
          channel_id: has("channel_id") ? payload.channel_id ?? null : undefined,
          customer_id: has("customer_id") ? payload.customer_id ?? null : undefined,
          total_amount: has("total_amount") ? payload.total_amount : undefined,
          status: has("status") ? payload.status : undefined,
          is_historical: has("is_historical") ? payload.is_historical : undefined,
        },
      });

      if (
        has("order_date") ||
        has("is_historical") ||
        has("channel_id") ||
        has("ref_no")
      ) {
        await syncSalesOrderMovements(tx, orderNo);
        await syncSalesOrderJournals(tx, orderNo, createdBy);
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
    await requireApiPermission(PERMISSIONS.SALES_ORDER_DELETE);

    const { orderNo } = await params;

    await prisma.$transaction(async (tx) => {
      const items = await tx.t_order_item.findMany({
        where: { order_no: orderNo },
        select: { id: true },
      });

      for (const item of items) {
        await removeSalesOrderItemMovements(tx, item.id);
        await deleteSalesOrderItemJournal(tx, item.id);
      }

      await tx.t_order_item.deleteMany({
        where: { order_no: orderNo },
      });

      await tx.approvals.deleteMany({
        where: { type: "sales_order", source_id: orderNo },
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
