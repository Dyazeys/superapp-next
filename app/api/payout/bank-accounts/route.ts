import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

export async function GET() {
  try {
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
