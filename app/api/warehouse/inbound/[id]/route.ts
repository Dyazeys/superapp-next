import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { removeInboundItemMovement } from "@/lib/warehouse-stock";
import { inboundDeliverySchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

type Tx = Prisma.TransactionClient;

async function seedInboundItemsFromPurchaseOrder(tx: Tx, inboundId: string, poId: string) {
  const [poItems, existingItems] = await Promise.all([
    tx.purchase_order_items.findMany({
      where: { po_id: poId },
      orderBy: [{ created_at: "asc" }, { id: "asc" }],
      select: {
        inv_code: true,
        unit_cost: true,
      },
    }),
    tx.inbound_items.findMany({
      where: { inbound_id: inboundId },
      select: { inv_code: true },
    }),
  ]);

  const existingInvCodes = new Set(existingItems.map((item) => item.inv_code));
  const uniquePoItemsByInvCode = new Map<string, { inv_code: string; unit_cost: Prisma.Decimal | null }>();

  for (const item of poItems) {
    if (!uniquePoItemsByInvCode.has(item.inv_code)) {
      uniquePoItemsByInvCode.set(item.inv_code, {
        inv_code: item.inv_code,
        unit_cost: item.unit_cost,
      });
    }
  }

  for (const item of uniquePoItemsByInvCode.values()) {
    if (existingInvCodes.has(item.inv_code)) {
      continue;
    }

    await tx.inbound_items.create({
      data: {
        inbound_id: inboundId,
        inv_code: item.inv_code,
        qty_received: 0,
        qty_passed_qc: 0,
        qty_rejected_qc: 0,
        unit_cost: item.unit_cost,
      },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_INBOUND_UPDATE);

    const { id } = await params;
    const payload = inboundDeliverySchema.partial().parse(await request.json());

    const inbound = await prisma.$transaction(async (tx) => {
      const current = await tx.inbound_deliveries.findUnique({
        where: { id },
        select: { qc_status: true, po_id: true },
      });
      if (!current) {
        throw new Error("Inbound delivery was not found.");
      }
      if (current.qc_status !== "PENDING") {
        throw new Error("Posted inbound is locked and cannot be edited.");
      }

      if (payload.po_id) {
        const purchaseOrder = await tx.purchase_orders.findUnique({
          where: { id: payload.po_id },
          select: { id: true, status: true },
        });
        invariant(purchaseOrder, "Purchase order was not found.");
        invariant(purchaseOrder.status !== "CLOSED", "PO is closed and cannot receive new inbound.");
      }

      const updated = await tx.inbound_deliveries.update({
        where: { id },
        data: {
          po_id: payload.po_id === undefined ? undefined : payload.po_id || null,
          receive_date: payload.receive_date === undefined ? undefined : asDateOnly(payload.receive_date),
          surat_jalan_vendor:
            payload.surat_jalan_vendor === undefined ? undefined : payload.surat_jalan_vendor || null,
          received_by: payload.received_by,
          notes: payload.notes === undefined ? undefined : payload.notes || null,
        },
      });

      if (updated.po_id) {
        await seedInboundItemsFromPurchaseOrder(tx, updated.id, updated.po_id);
      }

      return updated;
    });

    return NextResponse.json(toJsonValue(inbound));
  } catch (error) {
    return jsonError(error, "Failed to update inbound delivery.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_INBOUND_UPDATE);

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const inbound = await tx.inbound_deliveries.findUnique({
        where: { id },
        select: { qc_status: true },
      });
      if (!inbound) {
        throw new Error("Inbound delivery was not found.");
      }
      if (inbound.qc_status !== "PENDING") {
        throw new Error("Posted inbound is locked and cannot be deleted.");
      }

      const items = await tx.inbound_items.findMany({
        where: { inbound_id: id },
        select: { id: true, inv_code: true },
      });

      for (const item of items) {
        await removeInboundItemMovement(tx, item.id, item.inv_code);
      }

      await tx.inbound_items.deleteMany({
        where: { inbound_id: id },
      });

      await tx.approvals.deleteMany({
        where: { type: "inbound", source_id: id },
      });

      await tx.inbound_deliveries.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete inbound delivery.");
  }
}
