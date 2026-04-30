import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { masterProductSchema } from "@/schemas/product-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_MASTER_VIEW);

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
  } catch (error) {
    return jsonError(error, "Failed to load products.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_MASTER_CREATE);

    const payload = masterProductSchema.parse(await request.json());

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
        total_hpp: payload.total_hpp,
      },
    });

    return NextResponse.json(toJsonValue(product), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create product.");
  }
}
