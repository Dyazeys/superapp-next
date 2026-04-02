import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { purchaseOrderSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET() {
  const purchaseOrders = await prisma.purchase_orders.findMany({
    orderBy: [{ order_date: "desc" }, { po_number: "asc" }],
    include: {
      master_vendor: true,
      _count: {
        select: {
          inbound_deliveries: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(purchaseOrders));
}

export async function POST(request: NextRequest) {
  const payload = purchaseOrderSchema.parse(await request.json());

  const purchaseOrder = await prisma.purchase_orders.create({
    data: {
      po_number: payload.po_number,
      vendor_code: payload.vendor_code,
      order_date: asDateOnly(payload.order_date),
      status: payload.status,
    },
  });

  return NextResponse.json(toJsonValue(purchaseOrder), { status: 201 });
}
