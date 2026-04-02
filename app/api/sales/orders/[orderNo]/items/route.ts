import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { syncSalesOrderItemMovements } from "@/lib/warehouse-stock";
import { salesOrderItemSchema } from "@/schemas/sales-module";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params;

  const items = await prisma.t_order_item.findMany({
    where: { order_no: orderNo },
    orderBy: [{ created_at: "asc" }, { id: "asc" }],
    include: {
      master_product: {
        select: {
          sku: true,
          product_name: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(items));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params;
  const payload = salesOrderItemSchema.parse({ ...(await request.json()), order_no: orderNo });

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.t_order_item.create({
      data: {
        order_no: orderNo,
        sku: payload.sku || null,
        qty: payload.qty,
        unit_price: payload.unit_price,
        discount_item: payload.discount_item,
      },
      include: {
        master_product: {
          select: {
            sku: true,
            product_name: true,
          },
        },
      },
    });

    await syncSalesOrderItemMovements(tx, created.id);

    return created;
  });

  return NextResponse.json(toJsonValue(item), { status: 201 });
}
