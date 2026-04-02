import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { removeSalesOrderItemMovements, syncSalesOrderItemMovements } from "@/lib/warehouse-stock";
import { salesOrderItemSchema } from "@/schemas/sales-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string; id: string }> }
) {
  const { id } = await params;
  const payload = salesOrderItemSchema.partial().parse(await request.json());
  const itemId = Number(id);

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.t_order_item.update({
      where: { id: itemId },
      data: {
        sku: payload.sku === undefined ? undefined : payload.sku || null,
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

    await syncSalesOrderItemMovements(tx, itemId);

    return updated;
  });

  return NextResponse.json(toJsonValue(item));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNo: string; id: string }> }
) {
  const { orderNo, id } = await params;
  const itemId = Number(id);

  await prisma.$transaction(async (tx) => {
    await removeSalesOrderItemMovements(tx, itemId, orderNo);

    await tx.t_order_item.delete({
      where: { id: itemId },
    });
  });

  return NextResponse.json({ ok: true });
}
