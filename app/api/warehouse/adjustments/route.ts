import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { adjustmentSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_ADJUSTMENT_VIEW);

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
  } catch (error) {
    return jsonError(error, "Failed to load adjustments.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_ADJUSTMENT_CREATE);

    const payload = adjustmentSchema.parse(await request.json());

    const inventory = await prisma.master_inventory.findUnique({
      where: { inv_code: payload.inv_code },
      select: { inv_code: true, is_active: true },
    });
    invariant(inventory, "Inventory code was not found.");
    invariant(inventory.is_active, "Adjustments require an active inventory item.");

    const adjustment = await prisma.adjustments.create({
      data: {
        adjustment_date: asDateOnly(payload.adjustment_date),
        inv_code: payload.inv_code,
        adj_type: payload.adj_type,
        post_status: "DRAFT",
        posted_at: null,
        qty: payload.qty,
        reason: payload.reason,
        notes: payload.notes || null,
        created_by: payload.created_by || null,
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

    return NextResponse.json(toJsonValue(adjustment), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create adjustment.");
  }
}
