import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { masterInventorySchema } from "@/schemas/product-module";

export async function GET() {
  const inventory = await prisma.master_inventory.findMany({
    orderBy: { inv_code: "asc" },
  });

  return NextResponse.json(toJsonValue(inventory));
}

export async function POST(request: NextRequest) {
  const payload = masterInventorySchema.parse(await request.json());

  const inventory = await prisma.master_inventory.create({
    data: {
      inv_code: payload.inv_code,
      inv_name: payload.inv_name,
      description: payload.description || null,
      hpp: payload.hpp,
      is_active: payload.is_active,
    },
  });

  return NextResponse.json(toJsonValue(inventory), { status: 201 });
}
