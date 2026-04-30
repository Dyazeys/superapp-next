import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { syncSalesOrderJournals } from "@/lib/sales-journal";
import { syncSalesOrderMovements } from "@/lib/warehouse-stock";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.SALES_ORDER_POST);

    const { orderNo } = await params;

    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.t_order.findUnique({
        where: { order_no: orderNo },
        select: {
          order_no: true,
          is_historical: true,
          _count: {
            select: {
              t_order_item: true,
            },
          },
        },
      });

      invariant(current, "Sales order was not found.");
      invariant(!current.is_historical, "Historical order tidak mem-posting stock.");
      invariant(current._count.t_order_item > 0, "Sales order belum punya item untuk diposting.");

      await syncSalesOrderMovements(tx, orderNo);
      await syncSalesOrderJournals(tx, orderNo);

      const [summary] = await tx.$queryRaw<
        Array<{
          tracked_item_count: bigint | number;
          posted_item_count: bigint | number;
          blocked_item_count: bigint | number;
        }>
      >`
        WITH item_metrics AS (
          SELECT
            i.id AS item_id,
            COUNT(DISTINCT b.inv_code)::bigint AS expected_component_count,
            COUNT(DISTINCT m.inv_code)::bigint AS posted_component_count
          FROM sales.t_order_item i
          LEFT JOIN product.product_bom b
            ON b.sku = i.sku
           AND b.is_active = true
           AND b.is_stock_tracked = true
           AND b.inv_code IS NOT NULL
          LEFT JOIN warehouse.stock_movements m
            ON m.reference_type = 'SALE'
           AND m.reference_id = i.id::text
          WHERE i.order_no = ${orderNo}
          GROUP BY i.id
        )
        SELECT
          COUNT(*)::bigint AS tracked_item_count,
          COUNT(*) FILTER (
            WHERE expected_component_count > 0
              AND posted_component_count = expected_component_count
          )::bigint AS posted_item_count,
          COUNT(*) FILTER (
            WHERE expected_component_count <= 0
          )::bigint AS blocked_item_count
        FROM item_metrics
      `;

      const tracked = Number(summary?.tracked_item_count ?? 0);
      const posted = Number(summary?.posted_item_count ?? 0);
      const blocked = Number(summary?.blocked_item_count ?? 0);

      invariant(
        blocked === 0,
        `Posting diblok: ada ${blocked} item tanpa BOM stock-tracked aktif. Aktifkan BOM stock-tracked untuk SKU terkait dulu.`
      );
      invariant(
        posted === tracked,
        `Posting belum lengkap: ${posted}/${tracked} item berhasil diposting. Cek konfigurasi BOM/item order lalu coba lagi.`
      );

      return tx.t_order.findUnique({
        where: { order_no: orderNo },
      });
    });

    invariant(order, "Sales order was not found.");
    return NextResponse.json(toJsonValue(order));
  } catch (error) {
    return jsonError(error, "Failed to post sales order stock.");
  }
}
