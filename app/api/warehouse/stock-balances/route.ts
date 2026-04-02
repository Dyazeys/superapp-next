import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";

export async function GET() {
  const stockBalances = await prisma.stock_balances.findMany({
    orderBy: [{ qty_on_hand: "desc" }, { inv_code: "asc" }],
    include: {
      master_inventory: {
        select: {
          inv_code: true,
          inv_name: true,
          hpp: true,
          is_active: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(stockBalances));
}
