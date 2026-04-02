import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";

export async function GET() {
  const stockMovements = await prisma.stock_movements.findMany({
    orderBy: [{ movement_date: "desc" }, { created_at: "desc" }, { id: "desc" }],
    include: {
      master_inventory: {
        select: {
          inv_code: true,
          inv_name: true,
        },
      },
    },
    take: 100,
  });

  return NextResponse.json(toJsonValue(stockMovements));
}
