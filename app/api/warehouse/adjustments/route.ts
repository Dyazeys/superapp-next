import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { syncAdjustmentMovement } from "@/lib/warehouse-stock";
import { adjustmentSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET() {
  const adjustments = await prisma.adjustments.findMany({
    orderBy: [{ adjustment_date: "desc" }, { created_at: "desc" }],
    include: {
      master_inventory: {
        select: {
          inv_code: true,
          inv_name: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(adjustments));
}

export async function POST(request: NextRequest) {
  const payload = adjustmentSchema.parse(await request.json());

  const adjustment = await prisma.$transaction(async (tx) => {
    const created = await tx.adjustments.create({
      data: {
        adjustment_date: asDateOnly(payload.adjustment_date),
        inv_code: payload.inv_code,
        adj_type: payload.adj_type,
        qty: payload.qty,
        reason: payload.reason,
        approved_by: payload.approved_by || null,
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

    await syncAdjustmentMovement(tx, created.id);

    return created;
  });

  return NextResponse.json(toJsonValue(adjustment), { status: 201 });
}
