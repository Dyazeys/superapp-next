import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string; id: string }> }
) {
  try {
    const { sku, id } = await params;
    const raw = (await request.json()) as Record<string, unknown>;

    const current = await prisma.product_bom.findUniqueOrThrow({
      where: { id },
    });

    const payload = productBomSchema.parse({
      sku,
      component_group: normalizeBomGroup(
        raw.component_group === undefined ? current.component_group : raw.component_group
      ),
      component_type: raw.component_type === undefined ? current.component_type : raw.component_type,
      inv_code: raw.inv_code === undefined ? current.inv_code : raw.inv_code,
      component_name: raw.component_name === undefined ? current.component_name : raw.component_name,
      qty: raw.qty === undefined ? current.qty.toString() : raw.qty,
      unit_cost: raw.unit_cost === undefined ? current.unit_cost.toString() : raw.unit_cost,
      is_stock_tracked:
        raw.is_stock_tracked === undefined ? current.is_stock_tracked : raw.is_stock_tracked,
      notes: raw.notes === undefined ? current.notes ?? "" : raw.notes,
      sequence_no: raw.sequence_no === undefined ? current.sequence_no : raw.sequence_no,
      is_active: raw.is_active === undefined ? current.is_active : raw.is_active,
    });

    const nextInvCode = payload.inv_code;
    if (nextInvCode) {
      const inventory = await prisma.master_inventory.findUnique({
        where: { inv_code: nextInvCode },
        select: { inv_code: true },
      });
      invariant(inventory, "Inventory reference for BOM row was not found.");
    }

    const qty = payload.qty;
    const unitCost = payload.unit_cost;
    const lineCost = (Number(qty) * Number(unitCost)).toFixed(2);

    const bom = await prisma.product_bom.update({
      where: { id },
      data: {
        component_group: payload.component_group,
        component_type: payload.component_type,
        inv_code: payload.inv_code || null,
        component_name: payload.component_name,
        qty: payload.qty,
        unit_cost: payload.unit_cost,
        line_cost: lineCost,
        is_stock_tracked: payload.is_stock_tracked,
        notes: payload.notes || null,
        sequence_no: payload.sequence_no,
        is_active: payload.is_active,
      },
    });

    await syncProductHpp(sku);

    return NextResponse.json(toJsonValue(bom));
  } catch (error) {
    return jsonError(error, "Failed to update BOM row.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sku: string; id: string }> }
) {
  try {
    const { sku, id } = await params;

    await prisma.product_bom.delete({
      where: { id },
    });

    await syncProductHpp(sku);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete BOM row.");
  }
}
