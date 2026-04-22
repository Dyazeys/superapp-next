import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { removeAdjustmentMovement } from "@/lib/warehouse-stock";
import { adjustmentSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = adjustmentSchema.partial().parse(await request.json());

    const adjustment = await prisma.$transaction(async (tx) => {
      const current = await tx.adjustments.findUniqueOrThrow({
        where: { id },
      });
      invariant(current.post_status !== "POSTED", "Posted adjustment is locked and cannot be edited.");

      const updated = await tx.adjustments.update({
        where: { id },
        data: {
          adjustment_date:
            payload.adjustment_date === undefined ? undefined : asDateOnly(payload.adjustment_date),
          inv_code: payload.inv_code,
          adj_type: payload.adj_type,
          qty: payload.qty,
          reason: payload.reason,
          notes: payload.notes === undefined ? undefined : payload.notes || null,
          created_by: payload.created_by === undefined ? undefined : payload.created_by || null,
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

      return updated;
    });

    return NextResponse.json(toJsonValue(adjustment));
  } catch (error) {
    return jsonError(error, "Failed to update adjustment.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const current = await tx.adjustments.findUniqueOrThrow({
        where: { id },
        select: {
          inv_code: true,
          post_status: true,
        },
      });
      invariant(current.post_status !== "POSTED", "Posted adjustment is locked and cannot be deleted.");

      await removeAdjustmentMovement(tx, id, current.inv_code);

      await tx.adjustments.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete adjustment.");
  }
}
