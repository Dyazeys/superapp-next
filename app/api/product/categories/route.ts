import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { productCategorySchema } from "@/schemas/product-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_CATEGORY_VIEW);

    const categories = await prisma.category_product.findMany({
      orderBy: { category_code: "asc" },
      include: {
        _count: {
          select: {
            other_category_product: true,
            master_product: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(categories));
  } catch (error) {
    return jsonError(error, "Failed to load product categories.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_CATEGORY_CREATE);

    const payload = productCategorySchema.parse(await request.json());

    if (payload.parent_category_code) {
      invariant(
        payload.parent_category_code !== payload.category_code,
        "A category cannot be its own parent."
      );

      const parent = await prisma.category_product.findUnique({
        where: { category_code: payload.parent_category_code },
        select: { category_code: true },
      });
      invariant(parent, "Parent category was not found.");
    }

    const category = await prisma.category_product.create({
      data: {
        category_code: payload.category_code,
        parent_category_code: payload.parent_category_code || null,
        category_name: payload.category_name,
        is_active: payload.is_active,
      },
    });

    return NextResponse.json(toJsonValue(category), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create product category.");
  }
}
