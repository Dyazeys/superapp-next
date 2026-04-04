import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string; id: string }> }
) {
  try {
    const { sku, id } = await params;
    const payload = productBomSchema.partial().parse(await request.json());

    const current = await prisma.product_bom.findUniqueOrThrow({
      where: { id },
    });

    const nextInvCode = payload.inv_code === undefined ? current.inv_code : payload.inv_code;
    if (nextInvCode) {
      const inventory = await prisma.master_inventory.findUnique({
        where: { inv_code: nextInvCode },
        select: { inv_code: true },
      });
      invariant(inventory, "Inventory reference for BOM row was not found.");
    }

    const qty = payload.qty ?? current.qty.toString();
    const unitCost = payload.unit_cost ?? current.unit_cost.toString();
    const lineCost = (Number(qty) * Number(unitCost)).toFixed(2);

    const bom = await prisma.product_bom.update({
      where: { id },
      data: {
        component_group: payload.component_group,
        component_type: payload.component_type,
        inv_code: payload.inv_code === undefined ? undefined : payload.inv_code || null,
        component_name: payload.component_name,
        qty: payload.qty,
        unit_cost: payload.unit_cost,
        line_cost: lineCost,
        is_stock_tracked: payload.is_stock_tracked,
        notes: payload.notes === undefined ? undefined : payload.notes || null,
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
