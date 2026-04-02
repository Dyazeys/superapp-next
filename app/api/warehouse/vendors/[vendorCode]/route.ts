import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { vendorSchema } from "@/schemas/warehouse-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vendorCode: string }> }
) {
  const { vendorCode } = await params;
  const payload = vendorSchema.partial().parse(await request.json());

  const vendor = await prisma.master_vendor.update({
    where: { vendor_code: vendorCode },
    data: {
      vendor_name: payload.vendor_name,
      pic_name: payload.pic_name === undefined ? undefined : payload.pic_name || null,
      phone: payload.phone === undefined ? undefined : payload.phone || null,
      address: payload.address === undefined ? undefined : payload.address || null,
      is_active: payload.is_active,
    },
  });

  return NextResponse.json(toJsonValue(vendor));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorCode: string }> }
) {
  const { vendorCode } = await params;

  await prisma.master_vendor.delete({
    where: { vendor_code: vendorCode },
  });

  return NextResponse.json({ ok: true });
}
