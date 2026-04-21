import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { removeInboundItemMovement } from "@/lib/warehouse-stock";
import { inboundItemSchema } from "@/schemas/warehouse-module";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await prisma.inbound_items.findMany({
      where: { inbound_id: id },
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
    return jsonError(error, "Failed to load inbound items.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = inboundItemSchema.parse({ ...(await request.json()), inbound_id: id });

    const item = await prisma.$transaction(async (tx) => {
      const inbound = await tx.inbound_deliveries.findUnique({
        where: { id },
        select: { id: true, qc_status: true },
      });
      invariant(inbound, "Inbound delivery was not found.");
      invariant(inbound.qc_status !== "POSTED", "Posted inbound is locked and cannot receive new item edits.");

      const inventory = await tx.master_inventory.findUnique({
        where: { inv_code: payload.inv_code },
        select: { inv_code: true, is_active: true },
      });
      invariant(inventory, "Inventory code was not found.");
      invariant(inventory.is_active, "Inbound items require an active inventory item.");

      const created = await tx.inbound_items.create({
        data: {
          inbound_id: id,
          inv_code: payload.inv_code,
          qty_received: payload.qty_received,
          qty_passed_qc: payload.qty_passed_qc,
          qty_rejected_qc: payload.qty_rejected_qc,
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

      await removeInboundItemMovement(tx, created.id, created.inv_code);

      return created;
    });

    return NextResponse.json(toJsonValue(item), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create inbound item.");
  }
}
