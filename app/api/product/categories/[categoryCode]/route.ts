import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { productCategorySchema } from "@/schemas/product-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryCode: string }> }
) {
  const { categoryCode } = await params;
  const payload = productCategorySchema.partial().parse(await request.json());

  const category = await prisma.category_product.update({
    where: { category_code: categoryCode },
    data: {
      parent_category_code: payload.parent_category_code === undefined ? undefined : payload.parent_category_code || null,
      category_name: payload.category_name,
      is_active: payload.is_active,
    },
  });

  return NextResponse.json(toJsonValue(category));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryCode: string }> }
) {
  const { categoryCode } = await params;

  await prisma.category_product.delete({
    where: { category_code: categoryCode },
  });

  return NextResponse.json({ ok: true });
}
