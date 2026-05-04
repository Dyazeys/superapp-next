import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  await requireApiPermission(PERMISSIONS.WAREHOUSE_STOCK_VIEW);

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const skip = (page - 1) * limit;

  const [stockMovements, total] = await Promise.all([
    prisma.stock_movements.findMany({
      orderBy: [{ movement_date: "desc" }, { created_at: "desc" }, { id: "desc" }],
      include: {
        master_inventory: {
          select: {
            inv_code: true,
            inv_name: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.stock_movements.count(),
  ]);

  const saleItemIds = Array.from(
    new Set(
      stockMovements
        .filter((movement) => movement.reference_type === "SALE")
        .map((movement) => Number.parseInt(movement.reference_id, 10))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );

  const saleItems =
    saleItemIds.length > 0
      ? await prisma.t_order_item.findMany({
          where: { id: { in: saleItemIds } },
          select: {
            id: true,
            order_no: true,
            sku: true,
          },
        })
      : [];

  const saleItemById = new Map(
    saleItems.map((item) => [
      String(item.id),
      {
        item_id: item.id,
        order_no: item.order_no,
        sku: item.sku,
      },
    ])
  );

  const payload = stockMovements.map((movement) => ({
    ...movement,
    sale_reference:
      movement.reference_type === "SALE" ? saleItemById.get(movement.reference_id) ?? null : null,
  }));

  return NextResponse.json(
    toJsonValue({
      data: payload,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  );
}
