import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { DailyUploadUpdateSchema } from "@/schemas/content-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CONTENT_DAILY_REPORT_UPDATE);

    const { id } = await params;
    const body = await request.json();
    const parsed = DailyUploadUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (data.tanggal_aktivitas) {
      data.tanggal_aktivitas = new Date(
        (data.tanggal_aktivitas as string) + "T00:00:00.000Z"
      );
    }

    const item = await prisma.daily_uploads.update({
      where: { id },
      data,
    });

    return NextResponse.json(toJsonValue(item));
  } catch (error) {
    return jsonError(error, "Gagal mengupdate daily upload.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CONTENT_DAILY_REPORT_DELETE);

    const { id } = await params;

    await prisma.daily_uploads.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Gagal menghapus daily upload.");
  }
}