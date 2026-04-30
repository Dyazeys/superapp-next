import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  await requireApiPermission(PERMISSIONS.WAREHOUSE_STOCK_VIEW);

  const stockBalances = await prisma.stock_balances.findMany({
    orderBy: [{ qty_on_hand: "desc" }, { inv_code: "asc" }],
    include: {
      master_inventory: {
        select: {
          inv_code: true,
          inv_name: true,
          unit_price: true,
          is_active: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(stockBalances));
}
