import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { recalculatePurchaseOrderStatus } from "@/lib/warehouse-po-status";
import { purchaseOrderItemSchema } from "@/schemas/warehouse-module";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_VIEW);

    const { id } = await params;

    const [items, orderedByInv, receivedByInv] = await Promise.all([
      prisma.purchase_order_items.findMany({
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
      }),
      prisma.purchase_order_items.groupBy({
        by: ["inv_code"],
        where: { po_id: id },
        _sum: {
          qty_ordered: true,
        },
      }),
      prisma.inbound_items.groupBy({
        by: ["inv_code"],
        where: {
          inbound_deliveries: {
            po_id: id,
          },
        },
        _sum: {
          qty_received: true,
          qty_passed_qc: true,
          qty_rejected_qc: true,
        },
      }),
    ]);

    const orderedMap = new Map(
      orderedByInv.map((row) => [row.inv_code, Number(row._sum.qty_ordered ?? 0)])
    );
    const receivedMap = new Map(
      receivedByInv.map((row) => [
        row.inv_code,
        {
          qty_received: Number(row._sum.qty_received ?? 0),
          qty_passed_qc: Number(row._sum.qty_passed_qc ?? 0),
          qty_rejected_qc: Number(row._sum.qty_rejected_qc ?? 0),
        },
      ])
    );

    const itemsWithSummary = items.map((item) => {
      const qtyOrdered = orderedMap.get(item.inv_code) ?? 0;
      const qtyInbound = receivedMap.get(item.inv_code) ?? {
        qty_received: 0,
        qty_passed_qc: 0,
        qty_rejected_qc: 0,
      };
      const qtyRemaining = Math.max(0, qtyOrdered - qtyInbound.qty_received);
      const poFulfillmentStatus =
        qtyOrdered <= 0 ? "OPEN" : qtyInbound.qty_received <= 0 ? "OPEN" : qtyRemaining > 0 ? "PARTIAL" : "CLOSED";

      return {
        ...item,
        po_qty_ordered_total: qtyOrdered,
        po_qty_received_total: qtyInbound.qty_received,
        po_qty_passed_total: qtyInbound.qty_passed_qc,
        po_qty_rejected_total: qtyInbound.qty_rejected_qc,
        po_qty_remaining_total: qtyRemaining,
        po_fulfillment_status: poFulfillmentStatus,
      };
    });

    return NextResponse.json(toJsonValue(itemsWithSummary));
  } catch (error) {
    return jsonError(error, "Failed to load purchase order items.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_UPDATE);

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
