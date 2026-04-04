import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { removeSalesOrderItemMovements, syncSalesOrderItemMovements } from "@/lib/warehouse-stock";
import { salesOrderItemSchema } from "@/schemas/sales-module";

type Tx = Prisma.TransactionClient;

async function validateSalesItem(tx: Tx, orderNo: string, sku: string) {
  const order = await tx.t_order.findUnique({
    where: { order_no: orderNo },
    select: { order_no: true, is_historical: true },
  });
  invariant(order, "Sales order was not found.");

  const product = await tx.master_product.findUnique({
    where: { sku },
    select: { sku: true, is_active: true },
  });
  invariant(product, "Product SKU was not found.");
  invariant(product.is_active, "Sales items require an active product.");

  if (!order.is_historical) {
    const bomRows = await tx.product_bom.findMany({
      where: {
        sku,
        is_active: true,
        is_stock_tracked: true,
      },
      select: { inv_code: true },
    });

    invariant(bomRows.length > 0, "Normal sales orders require at least one active stock-tracked BOM row.");
    invariant(bomRows.every((row) => Boolean(row.inv_code)), "Stock-tracked BOM rows must include an inventory reference.");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string; id: string }> }
) {
  try {
    const { orderNo, id } = await params;
    const payload = salesOrderItemSchema.partial().parse(await request.json());
    const itemId = Number(id);

    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.t_order_item.findUniqueOrThrow({
        where: { id: itemId },
        select: { sku: true },
      });

      const nextSku = payload.sku ?? current.sku;
      invariant(nextSku, "SKU is required.");
      await validateSalesItem(tx, orderNo, nextSku);

      const updated = await tx.t_order_item.update({
        where: { id: itemId },
        data: {
          sku: payload.sku,
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
  } catch (error) {
    return jsonError(error, "Failed to update sales order item.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNo: string; id: string }> }
) {
  try {
    const { orderNo, id } = await params;
    const itemId = Number(id);

    await prisma.$transaction(async (tx) => {
      await removeSalesOrderItemMovements(tx, itemId, orderNo);

      await tx.t_order_item.delete({
        where: { id: itemId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete sales order item.");
  }
}
