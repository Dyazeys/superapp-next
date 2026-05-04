import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { deleteSalesOrderItemJournal, syncSalesOrderItemJournal } from "@/lib/sales-journal";
import { removeSalesOrderItemMovements, syncSalesOrderItemMovements } from "@/lib/warehouse-stock";
import { salesOrderItemPatchSchema } from "@/schemas/sales-module";

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
    const session = await requireApiPermission(PERMISSIONS.SALES_ORDER_UPDATE);
    const createdBy = session.user.username;

    const { orderNo, id } = await params;
    const rawPayload = await request.json();
    const payload = salesOrderItemPatchSchema.parse(rawPayload);
    const has = (key: string) => Object.prototype.hasOwnProperty.call(rawPayload, key);
    const itemId = Number(id);
    invariant(Number.isInteger(itemId) && itemId > 0, "Sales order item id is invalid.");

    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.t_order_item.findUniqueOrThrow({
        where: { id: itemId },
        select: {
          order_no: true,
          sku: true,
          qty: true,
          unit_price: true,
          discount_item: true,
        },
      });
      invariant(current.order_no === orderNo, "Sales order item was not found for this order.");

      const nextSku = payload.sku ?? current.sku;
      invariant(nextSku, "SKU is required.");
      await validateSalesItem(tx, orderNo, nextSku);

      const updated = await tx.t_order_item.update({
        where: { id: itemId },
        data: {
          sku: has("sku") ? payload.sku : undefined,
          qty: has("qty") ? payload.qty : undefined,
          unit_price: has("unit_price") ? payload.unit_price : undefined,
          discount_item: has("discount_item") ? payload.discount_item : undefined,
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
      await syncSalesOrderItemJournal(tx, itemId, createdBy);

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
    await requireApiPermission(PERMISSIONS.SALES_ORDER_DELETE);

    const { orderNo, id } = await params;
    const itemId = Number(id);
    invariant(Number.isInteger(itemId) && itemId > 0, "Sales order item id is invalid.");

    await prisma.$transaction(async (tx) => {
      const current = await tx.t_order_item.findUnique({
        where: { id: itemId },
        select: { order_no: true },
      });
      invariant(current, "Sales order item was not found.");
      invariant(current.order_no === orderNo, "Sales order item was not found for this order.");

      await removeSalesOrderItemMovements(tx, itemId, current.order_no);
      await deleteSalesOrderItemJournal(tx, itemId);

      await tx.t_order_item.delete({
        where: { id: itemId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete sales order item.");
  }
}
