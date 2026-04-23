import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
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

export async function GET() {
  try {
    const inbound = await prisma.inbound_deliveries.findMany({
      orderBy: [{ receive_date: "desc" }, { created_at: "desc" }],
      include: {
        purchase_orders: {
          include: {
            master_vendor: true,
          },
        },
        _count: {
          select: {
            inbound_items: true,
            returns: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(inbound));
  } catch (error) {
    return jsonError(error, "Failed to load inbound deliveries.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = inboundDeliverySchema.parse(await request.json());

    const inbound = await prisma.$transaction(async (tx) => {
      if (payload.po_id) {
        const purchaseOrder = await tx.purchase_orders.findUnique({
          where: { id: payload.po_id },
          select: { id: true, status: true },
        });
        invariant(purchaseOrder, "Purchase order was not found.");
        invariant(purchaseOrder.status !== "CLOSED", "PO is closed and cannot receive new inbound.");
      }

      const created = await tx.inbound_deliveries.create({
        data: {
          po_id: payload.po_id || null,
          receive_date: asDateOnly(payload.receive_date),
          surat_jalan_vendor: payload.surat_jalan_vendor || null,
          // Guardrail: inbound status can only become PASSED via /post endpoint flow.
          qc_status: "PENDING",
          received_by: payload.received_by,
          notes: payload.notes || null,
        },
      });

      if (created.po_id) {
        await seedInboundItemsFromPurchaseOrder(tx, created.id, created.po_id);
      }

      return created;
    });

    return NextResponse.json(toJsonValue(inbound), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create inbound delivery.");
  }
}
