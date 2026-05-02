import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { tiktokTrafficFormCreateSchema } from "@/schemas/marketing-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_TIKTOK_TRAFFIC_VIEW);

    const items = await prisma.tiktok_traffic.findMany({
      orderBy: [{ date: "desc" }],
    });

    return NextResponse.json(toJsonValue(items));
  } catch (error) {
    return jsonError(error, "Gagal memuat data traffic TikTok.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.MARKETING_TIKTOK_TRAFFIC_VIEW);

    const body = await request.json();
    const parsed = tiktokTrafficFormCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { date, ...rest } = parsed.data;

    const item = await prisma.tiktok_traffic.create({
      data: {
        date: new Date(date + "T00:00:00.000Z"),
        ...rest,
      },
    });

    return NextResponse.json(toJsonValue(item), { status: 201 });
  } catch (error) {
    return jsonError(error, "Gagal menyimpan data traffic TikTok.");
  }
}