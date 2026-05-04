import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { masterInventorySchema } from "@/schemas/product-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invCode: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_INVENTORY_UPDATE);

    const { invCode } = await params;
    const payload = masterInventorySchema.partial().parse(await request.json());

    const inventory = await prisma.master_inventory.update({
      where: { inv_code: invCode },
      data: {
        inv_name: payload.inv_name,
        description: payload.description === undefined ? undefined : payload.description || null,
        unit_cost: payload.unit_cost,
        is_active: payload.is_active,
      },
    });

    return NextResponse.json(toJsonValue(inventory));
  } catch (error) {
    return jsonError(error, "Failed to update inventory.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ invCode: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_INVENTORY_DELETE);

    const { invCode } = await params;

    await prisma.master_inventory.delete({
      where: { inv_code: invCode },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete inventory.");
  }
}
