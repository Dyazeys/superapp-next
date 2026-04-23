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

    const orderedJournalLines = journalLines
      .map((line, index) => ({ line, index }))
      .sort((a, b) => {
        if (a.line.journal_entry_id !== b.line.journal_entry_id) {
          return a.line.journal_entry_id > b.line.journal_entry_id ? -1 : 1;
        }

        const aAmount = Math.max(Number(a.line.debit), Number(a.line.credit));
        const bAmount = Math.max(Number(b.line.debit), Number(b.line.credit));
        if (aAmount !== bAmount) {
          return aAmount - bAmount;
        }

        const aDebitFirst = Number(a.line.debit) > 0 ? 0 : 1;
        const bDebitFirst = Number(b.line.debit) > 0 ? 0 : 1;
        if (aDebitFirst !== bDebitFirst) {
          return aDebitFirst - bDebitFirst;
        }

        return a.index - b.index;
      })
      .map((entry) => entry.line);

    return NextResponse.json(toJsonValue(orderedJournalLines));
  } catch (error) {
    return jsonError(error, "Failed to load journal lines.");
  }
}
