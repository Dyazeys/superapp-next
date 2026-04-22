import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { recalculatePurchaseOrderStatus } from "@/lib/warehouse-po-status";
import { purchaseOrderItemSchema } from "@/schemas/warehouse-module";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await prisma.purchase_order_items.findMany({
      where: { po_id: id },
      orderBy: [{ created_at: "asc" }, { id: "asc" }],
      include: {
        master_inventory: {
          select: {
            inv_code: true,
            inv_name: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(items));
  } catch (error) {
    return jsonError(error, "Failed to load purchase order items.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = purchaseOrderItemSchema.parse({ ...(await request.json()), po_id: id });

    const item = await prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchase_orders.findUnique({
        where: { id },
        select: { id: true },
      });
      invariant(purchaseOrder, "Purchase order was not found.");

      const inventory = await tx.master_inventory.findUnique({
        where: { inv_code: payload.inv_code },
        select: { inv_code: true, is_active: true },
      });
      invariant(inventory, "Inventory code was not found.");
      invariant(inventory.is_active, "PO items require an active inventory item.");

      const created = await tx.purchase_order_items.create({
        data: {
          po_id: id,
          inv_code: payload.inv_code,
          qty_ordered: payload.qty_ordered,
          unit_cost: payload.unit_cost,
        },
        include: {
          master_inventory: {
            select: {
              inv_code: true,
              inv_name: true,
            },
          },
        },
      });

      await recalculatePurchaseOrderStatus(tx, id);

      return created;
    });

    return NextResponse.json(toJsonValue(item), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create purchase order item.");
  }
}
