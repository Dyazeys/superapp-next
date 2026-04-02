import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { removeAdjustmentMovement, syncAdjustmentMovement } from "@/lib/warehouse-stock";
import { adjustmentSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = adjustmentSchema.partial().parse(await request.json());

  const adjustment = await prisma.$transaction(async (tx) => {
    const current = await tx.adjustments.findUniqueOrThrow({
      where: { id },
    });

    const updated = await tx.adjustments.update({
      where: { id },
      data: {
        adjustment_date:
          payload.adjustment_date === undefined ? undefined : asDateOnly(payload.adjustment_date),
        inv_code: payload.inv_code,
        adj_type: payload.adj_type,
        qty: payload.qty,
        reason: payload.reason,
        approved_by: payload.approved_by === undefined ? undefined : payload.approved_by || null,
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
      await removeAdjustmentMovement(tx, id, current.inv_code);
    }

    await syncAdjustmentMovement(tx, id);

    return updated;
  });

  return NextResponse.json(toJsonValue(adjustment));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    const current = await tx.adjustments.findUniqueOrThrow({
      where: { id },
      select: {
        inv_code: true,
      },
    });

    await removeAdjustmentMovement(tx, id, current.inv_code);

    await tx.adjustments.delete({
      where: { id },
    });
  });

  return NextResponse.json({ ok: true });
}
