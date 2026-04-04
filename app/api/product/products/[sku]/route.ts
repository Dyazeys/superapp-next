import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { masterProductSchema } from "@/schemas/product-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    const payload = masterProductSchema.partial().parse(await request.json());

    if (payload.category_code) {
      const category = await prisma.category_product.findUnique({
        where: { category_code: payload.category_code },
        select: { category_code: true },
      });
      invariant(category, "Category code was not found.");
    }

    if (payload.inv_main) {
      const mainInventory = await prisma.master_inventory.findUnique({
        where: { inv_code: payload.inv_main },
        select: { inv_code: true },
      });
      invariant(mainInventory, "Main inventory reference was not found.");
    }

    if (payload.inv_acc) {
      const accessoryInventory = await prisma.master_inventory.findUnique({
        where: { inv_code: payload.inv_acc },
        select: { inv_code: true },
      });
      invariant(accessoryInventory, "Accessory inventory reference was not found.");
    }

    const product = await prisma.master_product.update({
      where: { sku },
      data: {
        category_code: payload.category_code === undefined ? undefined : payload.category_code || null,
        sku_name: payload.sku_name,
        product_name: payload.product_name,
        color: payload.color === undefined ? undefined : payload.color || null,
        color_code: payload.color_code === undefined ? undefined : payload.color_code || null,
        size: payload.size === undefined ? undefined : payload.size || null,
        variations: payload.variations === undefined ? undefined : payload.variations || null,
        busa_code: payload.busa_code === undefined ? undefined : payload.busa_code || null,
        inv_main: payload.inv_main === undefined ? undefined : payload.inv_main || null,
        inv_acc: payload.inv_acc === undefined ? undefined : payload.inv_acc || null,
        is_bundling: payload.is_bundling,
        is_active: payload.is_active,
        price_mp: payload.price_mp,
        price_non_mp: payload.price_non_mp,
        total_hpp: payload.total_hpp,
      },
    });

    return NextResponse.json(toJsonValue(product));
  } catch (error) {
    return jsonError(error, "Failed to update product.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    await prisma.master_product.delete({
      where: { sku },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete product.");
  }
}
