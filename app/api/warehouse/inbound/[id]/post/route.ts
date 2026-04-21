import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { syncInboundItemMovement } from "@/lib/warehouse-stock";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inbound = await prisma.$transaction(async (tx) => {
      const current = await tx.inbound_deliveries.findUnique({
        where: { id },
        select: { id: true, qc_status: true },
      });
      invariant(current, "Inbound delivery was not found.");
      invariant(current.qc_status !== "POSTED", "Inbound is already posted.");

      const items = await tx.inbound_items.findMany({
        where: { inbound_id: id },
        select: { id: true },
      });
      invariant(items.length > 0, "Inbound has no items to post.");

      for (const item of items) {
        await syncInboundItemMovement(tx, item.id);
      }

      return tx.inbound_deliveries.update({
        where: { id },
        data: { qc_status: "POSTED" },
      });
    });

    return NextResponse.json(toJsonValue(inbound));
  } catch (error) {
    return jsonError(error, "Failed to post inbound.");
  }
}
