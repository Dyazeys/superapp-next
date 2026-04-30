import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { purchaseOrderSchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_VIEW);

    const purchaseOrders = await prisma.purchase_orders.findMany({
      orderBy: [{ order_date: "desc" }, { po_number: "asc" }],
      include: {
        master_vendor: true,
        _count: {
          select: {
            inbound_deliveries: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(purchaseOrders));
  } catch (error) {
    return jsonError(error, "Failed to load purchase orders.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_CREATE);

    const payload = purchaseOrderSchema.parse(await request.json());

    const vendor = await prisma.master_vendor.findUnique({
      where: { vendor_code: payload.vendor_code },
      select: { vendor_code: true, is_active: true },
    });
    invariant(vendor, "Vendor was not found.");
    invariant(vendor.is_active, "Purchase orders require an active vendor.");

    const purchaseOrder = await prisma.purchase_orders.create({
      data: {
        po_number: payload.po_number,
        vendor_code: payload.vendor_code,
        order_date: asDateOnly(payload.order_date),
        status: "OPEN",
      },
    });

    return NextResponse.json(toJsonValue(purchaseOrder), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create purchase order.");
  }
}
