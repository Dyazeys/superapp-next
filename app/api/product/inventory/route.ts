import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { masterInventorySchema } from "@/schemas/product-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_INVENTORY_VIEW);

    const inventory = await prisma.master_inventory.findMany({
      orderBy: { inv_code: "asc" },
    });

    return NextResponse.json(toJsonValue(inventory));
  } catch (error) {
    return jsonError(error, "Failed to load inventory.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_INVENTORY_CREATE);

    const payload = masterInventorySchema.parse(await request.json());

    const inventory = await prisma.master_inventory.create({
      data: {
        inv_code: payload.inv_code,
        inv_name: payload.inv_name,
        description: payload.description || null,
        unit_cost: payload.unit_cost,
        is_active: payload.is_active,
      },
    });

    return NextResponse.json(toJsonValue(inventory), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create inventory.");
  }
}
