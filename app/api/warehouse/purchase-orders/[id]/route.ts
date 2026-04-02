import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { purchaseOrderSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = purchaseOrderSchema.partial().parse(await request.json());

  const purchaseOrder = await prisma.purchase_orders.update({
    where: { id },
    data: {
      po_number: payload.po_number,
      vendor_code: payload.vendor_code,
      order_date: payload.order_date === undefined ? undefined : asDateOnly(payload.order_date),
      status: payload.status,
    },
  });

  return NextResponse.json(toJsonValue(purchaseOrder));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.purchase_orders.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
