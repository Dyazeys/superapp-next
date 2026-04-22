import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { syncAdjustmentMovement } from "@/lib/warehouse-stock";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const adjustment = await prisma.$transaction(async (tx) => {
      const current = await tx.adjustments.findUnique({
        where: { id },
        select: { id: true, post_status: true },
      });
      invariant(current, "Adjustment was not found.");
      invariant(current.post_status !== "POSTED", "Adjustment is already posted.");

      await syncAdjustmentMovement(tx, id);

      return tx.adjustments.update({
        where: { id },
        data: {
          post_status: "POSTED",
          posted_at: new Date(),
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
    });

    return NextResponse.json(toJsonValue(adjustment));
  } catch (error) {
    return jsonError(error, "Failed to post adjustment.");
  }
}
