import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { shopeeTrafficFormUpdateSchema } from "@/schemas/marketing-module";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_SHOPEE_TRAFFIC_VIEW);

    const { id } = await params;
    const body = await request.json();
    const parsed = shopeeTrafficFormUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.shopee_traffic.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }

    const { date, ...rest } = parsed.data;

    const item = await prisma.shopee_traffic.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date + "T00:00:00.000Z") } : {}),
        ...rest,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(toJsonValue(item));
  } catch (error) {
    return jsonError(error, "Gagal memperbarui data traffic Shopee.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_SHOPEE_TRAFFIC_VIEW);

    const { id } = await params;
    const existing = await prisma.shopee_traffic.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }

    await prisma.shopee_traffic.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Gagal menghapus data traffic Shopee.");
  }
}