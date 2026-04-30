import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.PAYOUT_TRANSFER_VIEW);

    const accounts = await prisma.accounts.findMany({
      where: {
        code: {
          startsWith: "111",
        },
      },
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        normal_balance: true,
      },
    });

    return NextResponse.json(toJsonValue(accounts));
  } catch (error) {
    return jsonError(error, "Failed to load payout bank accounts.");
  }
}
