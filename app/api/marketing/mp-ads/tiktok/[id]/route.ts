import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { mpAdsFormUpdateSchema } from "@/schemas/marketing-module";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_MP_ADS_VIEW);

    const { id } = await params;
    const body = await request.json();
    const parsed = mpAdsFormUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    if (updateData.date) {
      updateData.date = new Date((updateData.date as string) + "T00:00:00.000Z");
    }

    const item = await prisma.mp_ads_tiktok.update({
      where: { id },
      data: { ...updateData, updated_at: new Date() },
    });

    return NextResponse.json(toJsonValue(item));
  } catch (error) {
    return jsonError(error, "Gagal memperbarui data iklan TikTok.");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_MP_ADS_VIEW);

    const { id } = await params;

    await prisma.mp_ads_tiktok.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Gagal menghapus data iklan TikTok.");
  }
}