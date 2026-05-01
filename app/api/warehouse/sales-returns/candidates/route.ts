import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import type { SalesReturnCandidate } from "@/types/warehouse";
export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_STOCK_VIEW);

    // Cari t_order non-historical dengan status RETUR
    // yang belum ada di warehouse_returns
    const orders = await prisma.t_order.findMany({
      where: {
        status: "RETUR",
        is_historical: false,
        ref_no: { not: null },
        warehouseReturns: null,
      },
      include: {
        m_channel: {
          select: { channel_name: true },
        },
        t_order_item: {
          include: {
            master_product: {
              select: {
                sku: true,
                sku_name: true,
                product_name: true,
                inv_main: true,
                inv_acc: true,
                master_inventory_master_product_inv_mainTomaster_inventory: {
                  select: { inv_code: true, inv_name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { order_date: "desc" },
    });

    const candidates: SalesReturnCandidate[] = orders.map((order) => ({
      ref_no: order.ref_no!,
      order_no: order.order_no,
      order_date: order.order_date.toISOString(),
      channel_id: order.channel_id,
      channel_name: order.m_channel?.channel_name ?? null,
      status: order.status,
      items: order.t_order_item
        .filter((item): item is typeof item & { sku: string; master_product: NonNullable<typeof item.master_product> } => !!item.sku && !!item.master_product)
        .map((item) => {
          const invCode = item.master_product.inv_main ?? item.master_product.inv_acc ?? "";
          const invName =
            item.master_product
              .master_inventory_master_product_inv_mainTomaster_inventory
              ?.inv_name ?? "";
          return {
            sku: item.sku,
            sku_name: item.master_product.sku_name ?? "",
            product_name: item.master_product.product_name ?? "",
            inv_code: invCode,
            inv_name: invName,
            qty: item.qty,
          };
        }),
    }));

    return NextResponse.json(toJsonValue(candidates));
  } catch (error) {
    return jsonError(error, "Failed to load sales return candidates.");
  }
}