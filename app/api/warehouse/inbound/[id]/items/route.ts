import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { removeInboundItemMovement } from "@/lib/warehouse-stock";
import { inboundItemSchema } from "@/schemas/warehouse-module";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await prisma.$transaction(async (tx) => {
      const inbound = await tx.inbound_deliveries.findUnique({
        where: { id },
        select: { id: true, po_id: true },
      });
      invariant(inbound, "Inbound delivery was not found.");

      if (inbound.po_id) {
        await seedInboundItemsFromPurchaseOrder(tx, id, inbound.po_id);
      }

      return tx.inbound_items.findMany({
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
      invariant(inbound.qc_status === "PENDING", "Posted inbound is locked and cannot receive new item edits.");

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
