import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";
import { shopeeLivestreamFormUpdateSchema } from "@/schemas/marketing-module";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_SHOPEE_LIVESTREAM_VIEW);

    const { id } = await params;
    const body = await request.json();
    const parsed = shopeeLivestreamFormUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.shopee_livestream.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }

    const { date, ...rest } = parsed.data;

    const item = await prisma.shopee_livestream.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date + "T00:00:00.000Z") } : {}),
        ...rest,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return jsonError(error, "Gagal memperbarui data livestream Shopee.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_SHOPEE_LIVESTREAM_VIEW);

    const { id } = await params;
    const existing = await prisma.shopee_livestream.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }

    await prisma.shopee_livestream.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Gagal menghapus data livestream Shopee.");
  }
}