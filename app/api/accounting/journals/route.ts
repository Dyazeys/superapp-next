import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

export async function GET() {
  try {
    const journalEntries = await prisma.journal_entries.findMany({
      orderBy: [{ transaction_date: "desc" }, { created_at: "desc" }, { id: "desc" }],
      include: {
        journal_lines: {
          select: {
            debit: true,
            credit: true,
          },
        },
      },
      take: 200,
    });

    const journals = journalEntries.map((entry) => {
      const totalDebit = entry.journal_lines
        .reduce((sum, line) => sum + Number(line.debit), 0)
        .toFixed(2);
      const totalCredit = entry.journal_lines
        .reduce((sum, line) => sum + Number(line.credit), 0)
        .toFixed(2);

      return {
        id: entry.id,
        transaction_date: entry.transaction_date,
        reference_type: entry.reference_type,
        reference_id: entry.reference_id,
        description: entry.description,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        line_count: entry.journal_lines.length,
        total_debit: totalDebit,
        total_credit: totalCredit,
      };
    });

    return NextResponse.json(toJsonValue(journals));
  } catch (error) {
    return jsonError(error, "Failed to load accounting journals.");
  }
}
