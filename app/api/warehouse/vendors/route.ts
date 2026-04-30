import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { vendorSchema } from "@/schemas/warehouse-module";

export async function GET() {
  await requireApiPermission(PERMISSIONS.WAREHOUSE_VENDOR_VIEW);

  const vendors = await prisma.master_vendor.findMany({
    orderBy: { vendor_code: "asc" },
    include: {
      _count: {
        select: {
          purchase_orders: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(vendors));
}

export async function POST(request: NextRequest) {
  await requireApiPermission(PERMISSIONS.WAREHOUSE_VENDOR_CREATE);

  const payload = vendorSchema.parse(await request.json());

  const vendor = await prisma.master_vendor.create({
    data: {
      vendor_code: payload.vendor_code,
      vendor_name: payload.vendor_name,
      pic_name: payload.pic_name || null,
      phone: payload.phone || null,
      address: payload.address || null,
      is_active: payload.is_active,
    },
  });

  return NextResponse.json(toJsonValue(vendor), { status: 201 });
}
