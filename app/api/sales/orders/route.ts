import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { salesOrderSchema } from "@/schemas/sales-module";

function asDateTime(value: string) {
  return new Date(value);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawPage = Number(searchParams.get("page") ?? "1");
    const rawPageSize = Number(searchParams.get("page_size") ?? "20");
    const postingFilter = (searchParams.get("posting_filter") ?? "ALL").toUpperCase();

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(100, Math.floor(rawPageSize)) : 20;
    const offset = (page - 1) * pageSize;

    const postingWhereCondition: Prisma.Sql =
      postingFilter === "POSTED"
        ? Prisma.sql`
            o.is_historical = false
            AND COALESCE(p.tracked_item_count, 0) > 0
            AND COALESCE(p.blocked_item_count, 0) = 0
            AND COALESCE(p.posted_item_count, 0) = COALESCE(p.tracked_item_count, 0)
          `
        : postingFilter === "UNPOSTED"
          ? Prisma.sql`
              o.is_historical = false
              AND NOT (
                COALESCE(p.tracked_item_count, 0) > 0
                AND COALESCE(p.blocked_item_count, 0) = 0
                AND COALESCE(p.posted_item_count, 0) = COALESCE(p.tracked_item_count, 0)
              )
            `
          : postingFilter === "NO_POSTING"
            ? Prisma.sql`o.is_historical = true`
            : Prisma.sql`TRUE`;

    const baseCte = Prisma.sql`
      WITH item_metrics AS (
        SELECT
          i.order_no AS order_no,
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
        WHERE i.order_no IS NOT NULL
        GROUP BY i.order_no, i.id
      ),
      posting_by_order AS (
        SELECT
          order_no,
          COUNT(*)::bigint AS tracked_item_count,
          COUNT(*) FILTER (
            WHERE expected_component_count > 0
              AND posted_component_count = expected_component_count
          )::bigint AS posted_item_count,
          COUNT(*) FILTER (
            WHERE expected_component_count <= 0
          )::bigint AS blocked_item_count
        FROM item_metrics
        GROUP BY order_no
      ),
      item_count_by_order AS (
        SELECT
          i.order_no,
          COUNT(*)::bigint AS item_count
        FROM sales.t_order_item i
        WHERE i.order_no IS NOT NULL
        GROUP BY i.order_no
      ),
      filtered_orders AS (
        SELECT
          o.order_no,
          o.order_date,
          o.ref_no,
          o.parent_order_no,
          o.channel_id,
          o.customer_id,
          o.total_amount,
          o.status,
          o.is_historical,
          o.created_at,
          o.updated_at,
          COALESCE(p.tracked_item_count, 0)::bigint AS tracked_item_count,
          COALESCE(p.posted_item_count, 0)::bigint AS posted_item_count,
          COALESCE(p.blocked_item_count, 0)::bigint AS blocked_item_count,
          COALESCE(ic.item_count, 0)::bigint AS item_count
        FROM sales.t_order o
        LEFT JOIN posting_by_order p ON p.order_no = o.order_no
        LEFT JOIN item_count_by_order ic ON ic.order_no = o.order_no
        WHERE ${postingWhereCondition}
      )
    `;

    const [summary] = await prisma.$queryRaw<
      Array<{
        total_count: bigint | number;
        normal_count: bigint | number;
        historical_count: bigint | number;
      }>
    >(
      Prisma.sql`
        ${baseCte}
        SELECT
          COUNT(*)::bigint AS total_count,
          COUNT(*) FILTER (WHERE is_historical = false)::bigint AS normal_count,
          COUNT(*) FILTER (WHERE is_historical = true)::bigint AS historical_count
        FROM filtered_orders
      `
    );

    const total = Number(summary?.total_count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

    const rows = await prisma.$queryRaw<
      Array<{
        order_no: string;
        order_date: Date;
        ref_no: string | null;
        parent_order_no: string | null;
        channel_id: number | null;
        customer_id: number | null;
        total_amount: Prisma.Decimal | number | string;
        status: string;
        is_historical: boolean;
        created_at: Date;
        updated_at: Date;
        tracked_item_count: bigint | number;
        posted_item_count: bigint | number;
        blocked_item_count: bigint | number;
        item_count: bigint | number;
        channel_name: string | null;
        channel_slug: string | null;
        channel_is_marketplace: boolean | null;
        customer_name: string | null;
        customer_is_active: boolean | null;
      }>
    >(
      Prisma.sql`
        ${baseCte}
        SELECT
          f.order_no,
          f.order_date,
          f.ref_no,
          f.parent_order_no,
          f.channel_id,
          f.customer_id,
          f.total_amount,
          f.status,
          f.is_historical,
          f.created_at,
          f.updated_at,
          f.tracked_item_count,
          f.posted_item_count,
          f.blocked_item_count,
          f.item_count,
          c.channel_name,
          c.slug AS channel_slug,
          c.is_marketplace AS channel_is_marketplace,
          mc.customer_name,
          mc.is_active AS customer_is_active
        FROM filtered_orders f
        LEFT JOIN channel.m_channel c ON c.channel_id = f.channel_id
        LEFT JOIN sales.master_customer mc ON mc.customer_id = f.customer_id
        ORDER BY f.order_date DESC, f.order_no DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `
    );

    const data = rows.map((row) => {
      const tracked = Number(row.tracked_item_count ?? 0);
      const posted = Number(row.posted_item_count ?? 0);
      const blocked = Number(row.blocked_item_count ?? 0);
      const unposted = Math.max(0, tracked - posted);
      const posting_status = row.is_historical
        ? "NO_POSTING"
        : tracked <= 0
          ? "UNPOSTED"
          : blocked > 0
            ? posted > 0
              ? "PARTIAL"
              : "UNPOSTED"
            : posted <= 0
              ? "UNPOSTED"
              : unposted > 0
                ? "PARTIAL"
                : "POSTED";

      return {
        order_no: row.order_no,
        order_date: row.order_date,
        ref_no: row.ref_no,
        parent_order_no: row.parent_order_no,
        channel_id: row.channel_id,
        customer_id: row.customer_id,
        total_amount: row.total_amount,
        status: row.status,
        is_historical: row.is_historical,
        created_at: row.created_at,
        updated_at: row.updated_at,
        m_channel: row.channel_id
          ? {
              channel_id: row.channel_id,
              channel_name: row.channel_name ?? "-",
              slug: row.channel_slug,
              is_marketplace: Boolean(row.channel_is_marketplace),
            }
          : null,
        master_customer: row.customer_id
          ? {
              customer_id: row.customer_id,
              customer_name: row.customer_name ?? "-",
              is_active: Boolean(row.customer_is_active),
            }
          : null,
        _count: {
          t_order_item: Number(row.item_count ?? 0),
        },
        posting_summary: {
          tracked_item_count: tracked,
          posted_item_count: posted,
          unposted_item_count: unposted,
          blocked_item_count: blocked,
          posting_status,
        },
      };
    });

    return NextResponse.json(
      toJsonValue({
        data,
        page,
        page_size: pageSize,
        total,
        total_pages: totalPages,
        summary: {
          normal_count: Number(summary?.normal_count ?? 0),
          historical_count: Number(summary?.historical_count ?? 0),
        },
      })
    );
  } catch (error) {
    return jsonError(error, "Failed to load sales orders.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = salesOrderSchema.parse(await request.json());

    if (payload.channel_id != null) {
      const channel = await prisma.m_channel.findUnique({
        where: { channel_id: payload.channel_id },
        select: { channel_id: true },
      });
      invariant(channel, "Channel was not found.");
    }

    if (payload.customer_id != null) {
      const customer = await prisma.master_customer.findUnique({
        where: { customer_id: payload.customer_id },
        select: {
          customer_id: true,
          is_active: true,
        },
      });
      invariant(customer, "Customer was not found.");
      invariant(customer.is_active, "Sales orders require an active customer.");
    }

    if (payload.parent_order_no) {
      invariant(payload.parent_order_no !== payload.order_no, "Parent order cannot be the same as the order.");
      const parentOrder = await prisma.t_order.findUnique({
        where: { order_no: payload.parent_order_no },
        select: { order_no: true },
      });
      invariant(parentOrder, "Parent order was not found.");
    }

    const order = await prisma.t_order.create({
      data: {
        order_no: payload.order_no,
        order_date: asDateTime(payload.order_date),
        ref_no: payload.ref_no || null,
        parent_order_no: payload.parent_order_no || null,
        channel_id: payload.channel_id ?? null,
        customer_id: payload.customer_id ?? null,
        total_amount: payload.total_amount,
        status: payload.status,
        is_historical: payload.is_historical,
      },
    });

    return NextResponse.json(toJsonValue(order), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create sales order.");
  }
}
