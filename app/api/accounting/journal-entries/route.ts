import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

export async function GET(request: NextRequest) {
  try {
    const journalId = request.nextUrl.searchParams.get("journalId");

    const journalLines = await prisma.journal_lines.findMany({
      where: journalId ? { journal_entry_id: journalId } : undefined,
      orderBy: [{ journal_entry_id: "desc" }, { id: "asc" }],
      include: {
        accounts: {
          select: {
            id: true,
            code: true,
            name: true,
            normal_balance: true,
          },
        },
        journal_entries: {
          select: {
            id: true,
            transaction_date: true,
            reference_type: true,
            reference_id: true,
            description: true,
            created_at: true,
          },
        },
      },
      take: journalId ? 500 : 300,
    });

    return NextResponse.json(toJsonValue(journalLines));
  } catch (error) {
    return jsonError(error, "Failed to load journal lines.");
  }
}
