import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_STOCK_VIEW);

    const stockBalances = await prisma.stock_balances.findMany({
      orderBy: [{ qty_on_hand: "desc" }, { inv_code: "asc" }],
      include: {
        master_inventory: {
          select: {
            inv_name: true,
            unit_price: true,
            is_active: true,
            master_product_master_product_inv_mainTomaster_inventory: {
              select: {
                sku: true,
                product_name: true,
                variations: true,
                total_hpp: true,
                category_code: true,
                inv_main: true,
                inv_acc: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(stockBalances));
  } catch (error) {
    console.error("Failed to fetch stock balances:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data stock balance." },
      { status: 500 }
    );
  }
}
