import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { syncOperationalExpenseJournal } from "@/lib/operational-expense-journal";

function expenseInclude() {
  return {
    accounts_operational_expenses_expense_account_idToaccounts: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
    accounts_operational_expenses_payment_account_idToaccounts: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
    master_inventory: {
      select: {
        inv_code: true,
        inv_name: true,
      },
    },
  };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_VOID);
    const createdBy = session.user.username;

    const { id } = await params;

    const voided = await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expenses.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          is_product_barter: true,
        },
      });

      invariant(current, "Operational expense was not found.", 404);
      invariant(!current.is_product_barter, "Use Opex Barter module for inventory release / barter transactions.");
      invariant(current.status === "POSTED", "Only posted opex can be voided.");

      await tx.operational_expenses.update({
        where: { id },
        data: {
          status: "VOID",
          voided_at: new Date(),
          updated_at: new Date(),
        },
      });

      await syncOperationalExpenseJournal(tx, id, createdBy);

      return tx.operational_expenses.findUniqueOrThrow({
        where: { id },
        include: expenseInclude(),
      });
    });

    return NextResponse.json(toJsonValue(voided));
  } catch (error) {
    return jsonError(error, "Failed to void operational expense.");
  }
}
