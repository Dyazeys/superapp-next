import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { recalculatePurchaseOrderStatus } from "@/lib/warehouse-po-status";
import { purchaseOrderItemPatchSchema } from "@/schemas/warehouse-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_UPDATE);

    const { id, itemId } = await params;
    const payload = purchaseOrderItemPatchSchema.parse(await request.json());

    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.purchase_order_items.findUniqueOrThrow({
        where: { id: itemId },
      });
      invariant(current.po_id === id, "Purchase order item does not belong to this purchase order.");

      const nextInvCode = payload.inv_code ?? current.inv_code;
      const inventory = await tx.master_inventory.findUnique({
        where: { inv_code: nextInvCode },
        select: { inv_code: true, is_active: true },
      });
      invariant(inventory, "Inventory code was not found.");
      invariant(inventory.is_active, "PO items require an active inventory item.");

      const updated = await tx.purchase_order_items.update({
        where: { id: itemId },
        data: {
          inv_code: payload.inv_code,
          qty_ordered: payload.qty_ordered,
          unit_cost: payload.unit_cost === undefined ? undefined : payload.unit_cost,
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

      return updated;
    });

    return NextResponse.json(toJsonValue(item));
  } catch (error) {
    return jsonError(error, "Failed to update purchase order item.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_DELETE);

    const { id, itemId } = await params;

    await prisma.$transaction(async (tx) => {
      const current = await tx.purchase_order_items.findUniqueOrThrow({
        where: { id: itemId },
        select: {
          po_id: true,
        },
      });
      invariant(current.po_id === id, "Purchase order item does not belong to this purchase order.");

      await tx.purchase_order_items.delete({
        where: { id: itemId },
      });

      await recalculatePurchaseOrderStatus(tx, id);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete purchase order item.");
  }
}
