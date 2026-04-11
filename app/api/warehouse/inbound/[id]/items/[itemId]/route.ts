import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { removeInboundItemMovement, syncInboundItemMovement } from "@/lib/warehouse-stock";
import { inboundItemPatchSchema } from "@/schemas/warehouse-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const payload = inboundItemPatchSchema.parse(await request.json());

    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.inbound_items.findUniqueOrThrow({
        where: { id: itemId },
      });
      const nextQtyReceived = payload.qty_received ?? current.qty_received;
      const nextQtyPassedQc = payload.qty_passed_qc ?? current.qty_passed_qc;
      const nextQtyRejectedQc = payload.qty_rejected_qc ?? current.qty_rejected_qc;

      invariant(
        nextQtyPassedQc + nextQtyRejectedQc <= nextQtyReceived,
        "Passed and rejected QC cannot exceed received quantity."
      );

      invariant(
        nextQtyReceived > 0 || (nextQtyPassedQc === 0 && nextQtyRejectedQc === 0),
        "Received quantity must be greater than zero when QC quantities exist."
      );

      const nextInvCode = payload.inv_code ?? current.inv_code;
      const inventory = await tx.master_inventory.findUnique({
        where: { inv_code: nextInvCode },
        select: { inv_code: true, is_active: true },
      });
      invariant(inventory, "Inventory code was not found.");
      invariant(inventory.is_active, "Inbound items require an active inventory item.");

      const updated = await tx.inbound_items.update({
        where: { id: itemId },
        data: {
          inv_code: payload.inv_code,
          qty_received: payload.qty_received,
          qty_passed_qc: payload.qty_passed_qc,
          qty_rejected_qc: payload.qty_rejected_qc,
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

      if (payload.inv_code && payload.inv_code !== current.inv_code) {
        await removeInboundItemMovement(tx, itemId, current.inv_code);
      }

      await syncInboundItemMovement(tx, itemId);

      return updated;
    });

    return NextResponse.json(toJsonValue(item));
  } catch (error) {
    return jsonError(error, "Failed to update inbound item.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;

    await prisma.$transaction(async (tx) => {
      const current = await tx.inbound_items.findUniqueOrThrow({
        where: { id: itemId },
        select: {
          inv_code: true,
        },
      });

      await removeInboundItemMovement(tx, itemId, current.inv_code);

      await tx.inbound_items.delete({
        where: { id: itemId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete inbound item.");
  }
}
