import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.CONTENT_DAILY_REPORT_VIEW);

    const users = await prisma.users.findMany({
      where: { is_active: true },
      orderBy: [{ full_name: "asc" }, { username: "asc" }],
      select: {
        username: true,
        full_name: true,
      },
    });

    const options = users.map((user) => ({
      value: user.username,
      label: user.full_name?.trim() || user.username,
    }));

    return NextResponse.json(toJsonValue(options));
  } catch (error) {
    return jsonError(error, "Gagal memuat opsi PIC.");
  }
}
