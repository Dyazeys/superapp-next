import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

export async function GET() {
  try {
    const accounts = await prisma.accounts.findMany({
      orderBy: [{ code: "asc" }],
      include: {
        account_categories: {
          select: {
            id: true,
            name: true,
            report_type: true,
          },
        },
        accounts: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            journal_lines: true,
            other_accounts: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(accounts));
  } catch (error) {
    return jsonError(error, "Failed to load accounts.");
  }
}
