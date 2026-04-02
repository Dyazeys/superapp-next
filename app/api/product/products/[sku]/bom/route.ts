import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { productBomSchema } from "@/schemas/product-module";

async function syncProductHpp(sku: string) {
  const aggregate = await prisma.product_bom.aggregate({
    where: {
      sku,
      is_active: true,
    },
    _sum: {
      line_cost: true,
    },
  });

  await prisma.master_product.update({
    where: { sku },
    data: {
      total_hpp: aggregate._sum.line_cost ?? "0",
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;

  const bom = await prisma.product_bom.findMany({
    where: { sku },
    orderBy: [{ sequence_no: "asc" }, { created_at: "asc" }],
  });

  return NextResponse.json(toJsonValue(bom));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  const payload = productBomSchema.parse({ ...(await request.json()), sku });
  const lineCost = Number(payload.qty) * Number(payload.unit_cost);

  const bom = await prisma.product_bom.create({
    data: {
      sku,
      component_group: payload.component_group,
      component_type: payload.component_type,
      inv_code: payload.inv_code || null,
      component_name: payload.component_name,
      qty: payload.qty,
      unit_cost: payload.unit_cost,
      line_cost: lineCost.toFixed(2),
      is_stock_tracked: payload.is_stock_tracked,
      notes: payload.notes || null,
      sequence_no: payload.sequence_no,
      is_active: payload.is_active,
    },
  });

  await syncProductHpp(sku);

  return NextResponse.json(toJsonValue(bom), { status: 201 });
}
