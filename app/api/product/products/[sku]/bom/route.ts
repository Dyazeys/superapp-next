import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { productBomSchema } from "@/schemas/product-module";

function normalizeBomGroup(value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toUpperCase();
  if (normalized === "OVERHEAD") return "BRANDING";
  return normalized;
}

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
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_BOM_VIEW);

    const { sku } = await params;

    const bom = await prisma.product_bom.findMany({
      where: { sku },
      orderBy: [{ sequence_no: "asc" }, { created_at: "asc" }],
    });

    return NextResponse.json(toJsonValue(bom));
  } catch (error) {
    return jsonError(error, "Failed to load BOM rows.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_BOM_CREATE);

    const { sku } = await params;
    const raw = await request.json();
    const payload = productBomSchema.parse({
      ...raw,
      component_group: normalizeBomGroup(raw?.component_group),
      sku,
    });

    const product = await prisma.master_product.findUnique({
      where: { sku },
      select: { sku: true },
    });
    invariant(product, "Product was not found.");

    if (payload.inv_code) {
      const inventory = await prisma.master_inventory.findUnique({
        where: { inv_code: payload.inv_code },
        select: { inv_code: true },
      });
      invariant(inventory, "Inventory reference for BOM row was not found.");
    }

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
  } catch (error) {
    return jsonError(error, "Failed to create BOM row.");
  }
}
