import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { createWarehouseReturnSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_STOCK_VIEW);

    const returns = await prisma.warehouse_returns.findMany({
      orderBy: [{ return_date: "desc" }, { created_at: "desc" }],
      include: {
        return_items: {
          include: {
            master_product: {
              select: {
                sku: true,
                sku_name: true,
                product_name: true,
              },
            },
            master_inventory: {
              select: {
                inv_code: true,
                inv_name: true,
              },
            },
          },
        },
        t_order: {
          select: {
            order_no: true,
            channel_id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(returns));
  } catch (error) {
    return jsonError(error, "Failed to load warehouse returns.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_ADJUSTMENT_CREATE);

    const payload = createWarehouseReturnSchema.parse(await request.json());

    // Validasi ref_no exists di t_order
    const order = await prisma.t_order.findUnique({
      where: { ref_no: payload.ref_no },
      select: { ref_no: true, status: true, is_historical: true },
    });
    invariant(order, "Sales order reference was not found.");
    invariant(order.status === "RETUR", "Sales order must be in RETUR status.");
    invariant(!order.is_historical, "Historical sales order cannot be processed as warehouse return.");

    // Validasi setiap SKU + inv_code
    for (const item of payload.items) {
      const product = await prisma.master_product.findUnique({
        where: { sku: item.sku },
        select: { sku: true, is_active: true },
      });
      invariant(product, `SKU ${item.sku} was not found.`);
      invariant(product.is_active, `SKU ${item.sku} is not active.`);

      const inv = await prisma.master_inventory.findUnique({
        where: { inv_code: item.inv_code },
        select: { inv_code: true, is_active: true },
      });
      invariant(inv, `Inventory code ${item.inv_code} was not found.`);
      invariant(inv.is_active, `Inventory code ${item.inv_code} is not active.`);
    }

    const warehouseReturn = await prisma.warehouse_returns.create({
      data: {
        ref_no: payload.ref_no,
        return_date: asDateOnly(payload.return_date),
        status: "PENDING",
        verified_by: payload.verified_by,
        notes: payload.notes || null,
        return_items: {
          create: payload.items.map((item) => ({
            sku: item.sku,
            inv_code: item.inv_code,
            qty_returned: item.qty_returned,
          })),
        },
      },
      include: {
        return_items: true,
        t_order: {
          select: {
            order_no: true,
            channel_id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(warehouseReturn), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create warehouse return.");
  }
}