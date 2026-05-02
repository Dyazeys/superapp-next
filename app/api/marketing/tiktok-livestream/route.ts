import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { tiktokLivestreamFormCreateSchema } from "@/schemas/marketing-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_TIKTOK_LIVESTREAM_VIEW);

    const items = await prisma.tiktok_livestream.findMany({
      orderBy: [{ date: "desc" }, { sesi: "asc" }],
    });

    return NextResponse.json(toJsonValue(items));
  } catch (error) {
    return jsonError(error, "Gagal memuat data livestream TikTok.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_TIKTOK_LIVESTREAM_VIEW);

    const body = await request.json();
    const parsed = tiktokLivestreamFormCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { date, ...rest } = parsed.data;

    const item = await prisma.tiktok_livestream.create({
      data: {
        date: new Date(date + "T00:00:00.000Z"),
        ...rest,
      },
    });

    return NextResponse.json(toJsonValue(item), { status: 201 });
  } catch (error) {
    return jsonError(error, "Gagal menyimpan data livestream TikTok.");
  }
}