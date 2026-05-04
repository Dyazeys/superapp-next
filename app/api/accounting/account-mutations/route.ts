import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_MUTATION_VIEW);

    const accountCode = request.nextUrl.searchParams.get("accountCode");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");
    const openingBalanceOverride = Number(request.nextUrl.searchParams.get("openingBalance") ?? 0);

    if (!accountCode) {
      return NextResponse.json({ error: "accountCode is required" }, { status: 400 });
    }

    const account = await prisma.accounts.findFirst({ where: { code: accountCode } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const debitSum = await prisma.journal_lines.aggregate({
      where: { account_id: account.id, journal_entries: { transaction_date: { lt: start } } },
      _sum: { debit: true },
    });
    const creditSum = await prisma.journal_lines.aggregate({
      where: { account_id: account.id, journal_entries: { transaction_date: { lt: start } } },
      _sum: { credit: true },
    });

    const previousBalance = Number(debitSum._sum.debit ?? 0) - Number(creditSum._sum.credit ?? 0);
    const effectiveOpeningBalance = previousBalance + openingBalanceOverride;

    const lines = await prisma.journal_lines.findMany({
      where: { account_id: account.id, journal_entries: { transaction_date: { gte: start, lte: end } } },
      include: {
        journal_entries: { select: { id: true, transaction_date: true, description: true, created_at: true } },
      },
      orderBy: [{ journal_entries: { transaction_date: "asc" } }, { journal_entries: { created_at: "asc" } }, { id: "asc" }],
    });

    let runningBalance = effectiveOpeningBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const mutationLines = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      runningBalance += debit - credit;
      totalDebit += debit;
      totalCredit += credit;

      return {
        id: line.id,
        transaction_date: line.journal_entries.transaction_date,
        description: line.journal_entries.description,
        journal_entry_id: line.journal_entry_id,
        debit,
        credit,
        balance_after: runningBalance,
      };
    });

    return NextResponse.json(
      toJsonValue({
        account: { code: account.code, name: account.name },
        opening_balance: effectiveOpeningBalance,
        total_debit: totalDebit,
        total_credit: totalCredit,
        ending_balance: runningBalance,
        lines: mutationLines,
      })
    );
  } catch (error) {
    return jsonError(error, "Failed to load account mutations.");
  }
}
