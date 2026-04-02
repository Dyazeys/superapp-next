import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { masterInventorySchema } from "@/schemas/product-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invCode: string }> }
) {
  const { invCode } = await params;
  const payload = masterInventorySchema.partial().parse(await request.json());

  const inventory = await prisma.master_inventory.update({
    where: { inv_code: invCode },
    data: {
      inv_name: payload.inv_name,
      description: payload.description === undefined ? undefined : payload.description || null,
      hpp: payload.hpp,
      is_active: payload.is_active,
    },
  });

  return NextResponse.json(toJsonValue(inventory));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ invCode: string }> }
) {
  const { invCode } = await params;

  await prisma.master_inventory.delete({
    where: { inv_code: invCode },
  });

  return NextResponse.json({ ok: true });
}
