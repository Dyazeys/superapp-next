import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { parseCsv } from "@/lib/csv";
import { PERMISSIONS } from "@/lib/rbac";
import { syncSalesOrderItemMovements } from "@/lib/warehouse-stock";
import { syncSalesOrderItemJournal } from "@/lib/sales-journal";

const REQUIRED_HEADERS = ["order_no", "order_date", "sku", "qty", "unit_price", "status"];
const VALID_STATUSES = ["PICKUP", "RETUR", "SUKSES"];

type ValidationError = {
  row: number;
  order_no: string;
  message: string;
};

type ParsedItem = {
  sku: string;
  qty: number;
  unit_price: string;
  discount_item: string;
};

type ParsedOrder = {
  order_no: string;
  order_date: string;
  ref_no: string | null;
  channel_id: number | null;
  customer_id: number | null;
  status: string;
  is_historical: boolean;
  items: ParsedItem[];
};

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.SALES_ORDER_CREATE);

    const formData = await request.formData();
    const file = formData.get("file");
    invariant(file instanceof File, "File CSV diperlukan.");

    const text = await file.text();
    const { headers, rows, rowNumbers } = parseCsv(text);

    const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    invariant(missingHeaders.length === 0, `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`);

    if (rows.length === 0) {
      invariant(false, "File CSV kosong.");
    }

    const groups = new Map<string, { rows: typeof rows; rowNumbers: number[] }>();
    for (let i = 0; i < rows.length; i++) {
      const orderNo = rows[i].order_no?.trim();
      if (!orderNo) continue;
      const g = groups.get(orderNo) ?? { rows: [], rowNumbers: [] };
      g.rows.push(rows[i]);
      g.rowNumbers.push(rowNumbers[i]);
      groups.set(orderNo, g);
    }

    const errors: ValidationError[] = [];
    const orders: ParsedOrder[] = [];

    for (const [orderNo, group] of groups) {
      const first = group.rows[0];
      const csvRow = group.rowNumbers[0];

      const existing = await prisma.t_order.findUnique({ where: { order_no: orderNo } });
      if (existing) {
        errors.push({ row: csvRow, order_no: orderNo, message: `Order "${orderNo}" sudah ada di database.` });
        continue;
      }

      const orderDate = first.order_date?.trim();
      const status = first.status?.trim();

      if (!orderDate || Number.isNaN(Date.parse(orderDate))) {
        errors.push({ row: csvRow, order_no: orderNo, message: `"order_date" tidak valid: ${orderDate}` });
      }
      if (!status || !VALID_STATUSES.includes(status)) {
        errors.push({ row: csvRow, order_no: orderNo, message: `"status" harus ${VALID_STATUSES.join("/")}: ${status}` });
      }

      for (const field of ["order_date", "ref_no", "channel_id", "customer_id", "status", "is_historical"] as const) {
        const vals = new Set(group.rows.map((r) => r[field]?.trim() ?? ""));
        if (vals.size > 1) {
          errors.push({ row: csvRow, order_no: orderNo, message: `"${field}" tidak konsisten dalam satu order. Semua baris harus sama.` });
        }
      }

      const isHistorical = first.is_historical?.trim() === "true";
      const refNo = first.ref_no?.trim() || null;
      const channelId = first.channel_id?.trim() ? Number(first.channel_id) : null;
      const customerId = first.customer_id?.trim() ? Number(first.customer_id) : null;

      if (channelId !== null) {
        const ch = await prisma.m_channel.findUnique({ where: { channel_id: channelId } });
        if (!ch) errors.push({ row: csvRow, order_no: orderNo, message: `channel_id "${channelId}" tidak ditemukan.` });
      }

      if (customerId !== null) {
        const cust = await prisma.master_customer.findUnique({ where: { customer_id: customerId } });
        if (!cust || !cust.is_active) {
          errors.push({ row: csvRow, order_no: orderNo, message: `customer_id "${customerId}" tidak ditemukan atau tidak aktif.` });
        }
      }

      const items: ParsedItem[] = [];
      const seenSkus = new Set<string>();

      for (let i = 0; i < group.rows.length; i++) {
        const row = group.rows[i];
        const itemRow = group.rowNumbers[i];
        const sku = row.sku?.trim();

        if (!sku) {
          errors.push({ row: itemRow, order_no: orderNo, message: `"sku" wajib diisi.` });
          continue;
        }
        if (seenSkus.has(sku)) {
          errors.push({ row: itemRow, order_no: orderNo, message: `SKU "${sku}" duplikat dalam order yang sama.` });
          continue;
        }
        seenSkus.add(sku);

        const prod = await prisma.master_product.findUnique({ where: { sku } });
        if (!prod) {
          errors.push({ row: itemRow, order_no: orderNo, message: `SKU "${sku}" tidak ditemukan.` });
          continue;
        }
        if (!prod.is_active) {
          errors.push({ row: itemRow, order_no: orderNo, message: `SKU "${sku}" tidak aktif.` });
          continue;
        }

        if (!isHistorical) {
          const bom = await prisma.product_bom.findMany({
            where: { sku, is_active: true, is_stock_tracked: true },
            select: { inv_code: true },
          });
          if (bom.length === 0) {
            errors.push({ row: itemRow, order_no: orderNo, message: `SKU "${sku}" tidak memiliki BOM stock-tracked aktif. Gunakan is_historical=true.` });
            continue;
          }
          if (!bom.every((b) => Boolean(b.inv_code))) {
            errors.push({ row: itemRow, order_no: orderNo, message: `SKU "${sku}" memiliki BOM tanpa inventory reference.` });
            continue;
          }
        }

        const qty = Number(row.qty);
        if (!row.qty?.trim() || !Number.isInteger(qty) || qty < 1) {
          errors.push({ row: itemRow, order_no: orderNo, message: `"qty" harus angka bulat ≥ 1: ${row.qty}` });
          continue;
        }

        const unitPrice = row.unit_price?.trim() || "0";
        if (Number.isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
          errors.push({ row: itemRow, order_no: orderNo, message: `"unit_price" harus angka ≥ 0: ${unitPrice}` });
          continue;
        }

        const discountItem = row.discount_item?.trim() || "0";

        items.push({ sku, qty, unit_price: unitPrice, discount_item: discountItem });
      }

      if (items.length === 0) {
        errors.push({ row: csvRow, order_no: orderNo, message: "Tidak ada item valid untuk order ini." });
      }

      if (!orderDate || !status) continue;

      orders.push({
        order_no: orderNo,
        order_date: orderDate,
        ref_no: refNo,
        channel_id: channelId,
        customer_id: customerId,
        status,
        is_historical: isHistorical,
        items,
      });
    }

    const isReview = request.nextUrl.searchParams.get("review") === "1";

    if (isReview) {
      return NextResponse.json({
        valid: errors.length === 0,
        totalRows: rows.length,
        orderCount: groups.size,
        errors,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: `${errors.length} error ditemukan. Jalankan review dulu sebelum upload.` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        await tx.t_order.create({
          data: {
            order_no: order.order_no,
            order_date: new Date(order.order_date),
            ref_no: order.ref_no,
            channel_id: order.channel_id,
            customer_id: order.customer_id,
            total_amount: "0",
            status: order.status,
            is_historical: order.is_historical,
          },
        });

        for (const item of order.items) {
          const createdItem = await tx.t_order_item.create({
            data: {
              order_no: order.order_no,
              sku: item.sku,
              qty: item.qty,
              unit_price: item.unit_price,
              discount_item: item.discount_item,
            },
          });

          if (!order.is_historical) {
            await syncSalesOrderItemMovements(tx, createdItem.id);
            await syncSalesOrderItemJournal(tx, createdItem.id);
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      orders: orders.length,
      items: orders.reduce((sum, o) => sum + o.items.length, 0),
    });
  } catch (error) {
    return jsonError(error, "Gagal mengimpor CSV.");
  }
}
