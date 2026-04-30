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
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_POST);

    const { id } = await params;

    const posted = await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expenses.findUnique({
        where: { id },
      });

      invariant(current, "Operational expense was not found.", 404);
      invariant(!current.is_product_barter, "Use Opex Barter module for inventory release / barter transactions.");
      invariant(current.status === "DRAFT", "Only draft opex can be posted.");
      invariant(current.payment_account_id, "Payment account is required before posting opex.");
      invariant(Number(current.amount) > 0, "Amount must be greater than zero before posting opex.");

      await tx.operational_expenses.update({
        where: { id },
        data: {
          status: "POSTED",
          posted_at: new Date(),
          voided_at: null,
          updated_at: new Date(),
        },
      });

      await syncOperationalExpenseJournal(tx, id);

      return tx.operational_expenses.findUniqueOrThrow({
        where: { id },
        include: expenseInclude(),
      });
    });

    return NextResponse.json(toJsonValue(posted));
  } catch (error) {
    return jsonError(error, "Failed to post operational expense.");
  }
}
