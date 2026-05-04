import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { syncSalesOrderItemJournal } from "@/lib/sales-journal";
import { syncSalesOrderItemMovements } from "@/lib/warehouse-stock";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.SALES_ORDER_VIEW);

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
  } catch (error) {
    return jsonError(error, "Failed to load sales order items.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const session = await requireApiPermission(PERMISSIONS.SALES_ORDER_CREATE);
    const createdBy = session.user.username;

    const { orderNo } = await params;
    const payload = salesOrderItemSchema.parse({ ...(await request.json()), order_no: orderNo });

    const item = await prisma.$transaction(async (tx) => {
      await validateSalesItem(tx, orderNo, payload.sku);

      const created = await tx.t_order_item.create({
        data: {
          order_no: orderNo,
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

      await syncSalesOrderItemMovements(tx, created.id);
      await syncSalesOrderItemJournal(tx, created.id, createdBy);

      return created;
    });

    return NextResponse.json(toJsonValue(item), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create sales order item.");
  }
}
