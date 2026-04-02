import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { removeInboundItemMovement, syncInboundItemMovement } from "@/lib/warehouse-stock";
import { inboundItemSchema } from "@/schemas/warehouse-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;
  const payload = inboundItemSchema.partial().parse(await request.json());

  const item = await prisma.$transaction(async (tx) => {
    const current = await tx.inbound_items.findUniqueOrThrow({
      where: { id: itemId },
    });

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
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
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
}
