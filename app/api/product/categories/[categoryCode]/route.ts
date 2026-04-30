import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { productCategorySchema } from "@/schemas/product-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryCode: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_CATEGORY_UPDATE);

    const { categoryCode } = await params;
    const payload = productCategorySchema.partial().parse(await request.json());

    if (payload.parent_category_code !== undefined) {
      invariant(payload.parent_category_code !== categoryCode, "A category cannot be its own parent.");

      if (payload.parent_category_code) {
        const parent = await prisma.category_product.findUnique({
          where: { category_code: payload.parent_category_code },
          select: { category_code: true },
        });
        invariant(parent, "Parent category was not found.");
      }
    }

    const category = await prisma.category_product.update({
      where: { category_code: categoryCode },
      data: {
        parent_category_code: payload.parent_category_code === undefined ? undefined : payload.parent_category_code || null,
        category_name: payload.category_name,
        is_active: payload.is_active,
      },
    });

    return NextResponse.json(toJsonValue(category));
  } catch (error) {
    return jsonError(error, "Failed to update product category.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryCode: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_CATEGORY_DELETE);

    const { categoryCode } = await params;

    await prisma.category_product.delete({
      where: { category_code: categoryCode },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete product category.");
  }
}
