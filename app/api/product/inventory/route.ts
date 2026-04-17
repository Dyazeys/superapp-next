import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { masterInventorySchema } from "@/schemas/product-module";

export async function GET() {
  try {
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
    const payload = masterInventorySchema.parse(await request.json());

    const inventory = await prisma.master_inventory.create({
      data: {
        inv_code: payload.inv_code,
        inv_name: payload.inv_name,
        description: payload.description || null,
        unit_price: payload.unit_price,
        is_active: payload.is_active,
      },
    });

    return NextResponse.json(toJsonValue(inventory), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create inventory.");
  }
}
