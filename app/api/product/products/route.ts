import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { masterProductSchema } from "@/schemas/product-module";

export async function GET() {
  const products = await prisma.master_product.findMany({
    orderBy: { sku: "asc" },
    include: {
      category_product: true,
      master_inventory_master_product_inv_mainTomaster_inventory: true,
      master_inventory_master_product_inv_accTomaster_inventory: true,
      _count: {
        select: {
          product_bom: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(products));
}

export async function POST(request: NextRequest) {
  const payload = masterProductSchema.parse(await request.json());

  const product = await prisma.master_product.create({
    data: {
      sku: payload.sku,
      category_code: payload.category_code || null,
      sku_name: payload.sku_name,
      product_name: payload.product_name,
      color: payload.color || null,
      color_code: payload.color_code || null,
      size: payload.size || null,
      variations: payload.variations || null,
      busa_code: payload.busa_code || null,
      inv_main: payload.inv_main || null,
      inv_acc: payload.inv_acc || null,
      is_bundling: payload.is_bundling,
      is_active: payload.is_active,
      price_mp: payload.price_mp,
      price_non_mp: payload.price_non_mp,
      total_hpp: payload.total_hpp,
    },
  });

  return NextResponse.json(toJsonValue(product), { status: 201 });
}
