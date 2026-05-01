import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { verifyWarehouseReturnSchema } from "@/schemas/warehouse-module";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_STOCK_VIEW);

    const { id } = await params;

    const warehouseReturn = await prisma.warehouse_returns.findUnique({
      where: { id },
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

    invariant(warehouseReturn, "Warehouse return not found.");

    return NextResponse.json(toJsonValue(warehouseReturn));
  } catch (error) {
    return jsonError(error, "Failed to load warehouse return.");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_ADJUSTMENT_POST);

    const { id } = await params;

    const existing = await prisma.warehouse_returns.findUnique({
      where: { id },
      select: { id: true, status: true, ref_no: true },
    });
    invariant(existing, "Warehouse return not found.");
    invariant(existing.status === "PENDING", "Can only verify a PENDING return.");

    const payload = verifyWarehouseReturnSchema.parse(await request.json());
    const verifiedAt = payload.verified_at
      ? new Date(payload.verified_at)
      : new Date();

    // Update return header status
    await prisma.warehouse_returns.update({
      where: { id },
      data: {
        status: payload.status,
        verified_at: verifiedAt,
      },
    });

    // Update item details if provided
    if (payload.items && payload.items.length > 0) {
      for (const item of payload.items) {
        await prisma.warehouse_return_items.update({
          where: { id: item.id },
          data: {
            qty_good: item.qty_good ?? null,
            qty_damaged: item.qty_damaged ?? null,
            unit_cost: item.unit_cost ?? null,
          },
        });
      }
    }

    // Ambil data lengkap setelah update
    const result = await prisma.warehouse_returns.findUnique({
      where: { id },
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

    return NextResponse.json(toJsonValue(result));
  } catch (error) {
    return jsonError(error, "Failed to verify warehouse return.");
  }
}