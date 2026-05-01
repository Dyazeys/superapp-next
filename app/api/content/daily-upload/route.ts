import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { DailyUploadCreateSchema } from "@/schemas/content-module";

async function ensureActivePicExists(pic: string) {
  const user = await prisma.users.findFirst({
    where: {
      username: pic,
      is_active: true,
    },
    select: { username: true },
  });

  return Boolean(user);
}

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.CONTENT_DAILY_REPORT_VIEW);

    const items = await prisma.daily_uploads.findMany({
      orderBy: [{ tanggal_aktivitas: "desc" }, { created_at: "desc" }],
    });

    return NextResponse.json(toJsonValue(items));
  } catch (error) {
    return jsonError(error, "Gagal memuat data daily upload.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.CONTENT_DAILY_REPORT_CREATE);

    const body = await request.json();
    const parsed = DailyUploadCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (!(await ensureActivePicExists(parsed.data.pic))) {
      return NextResponse.json(
        { error: "PIC harus dipilih dari user aktif yang tersedia." },
        { status: 400 },
      );
    }

    const item = await prisma.daily_uploads.create({
      data: {
        tanggal_aktivitas: new Date(parsed.data.tanggal_aktivitas + "T00:00:00.000Z"),
        akun: parsed.data.akun,
        platform: parsed.data.platform,
        jenis_konten: parsed.data.jenis_konten,
        tipe_aktivitas: parsed.data.tipe_aktivitas,
        produk: parsed.data.produk,
        link_konten: parsed.data.link_konten,
        pic: parsed.data.pic,
        status: parsed.data.status,
      },
    });

    return NextResponse.json(toJsonValue(item), { status: 201 });
  } catch (error) {
    return jsonError(error, "Gagal menyimpan daily upload.");
  }
}
