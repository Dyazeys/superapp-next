import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { productCategorySchema } from "@/schemas/product-module";

export async function GET() {
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
}

export async function POST(request: NextRequest) {
  const payload = productCategorySchema.parse(await request.json());

  const category = await prisma.category_product.create({
    data: {
      category_code: payload.category_code,
      parent_category_code: payload.parent_category_code || null,
      category_name: payload.category_name,
      is_active: payload.is_active,
    },
  });

  return NextResponse.json(toJsonValue(category), { status: 201 });
}
