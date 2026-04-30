import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { syncOperationalExpenseBarterJournal } from "@/lib/operational-expense-barter";
import { syncOperationalExpenseBarterMovements } from "@/lib/warehouse-stock";

function barterInclude() {
  return {
    accounts_operational_expense_barter_expense_account_idToaccounts: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
    operational_expense_barter_items: {
      orderBy: [{ created_at: "asc" as const }, { id: "asc" as const }],
      include: {
        master_inventory: {
          select: {
            inv_code: true,
            inv_name: true,
            is_active: true,
          },
        },
      },
    },
  };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_VOID);

    const { id } = await params;

    const voided = await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expense_barter.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });
      invariant(current, "Operational expense barter was not found.", 404);
      invariant(current.status === "POSTED", "Only posted barter can be voided.");

      await tx.operational_expense_barter.update({
        where: { id },
        data: {
          status: "VOID",
          voided_at: new Date(),
          updated_at: new Date(),
        },
      });

      await syncOperationalExpenseBarterMovements(tx, id);
      await syncOperationalExpenseBarterJournal(tx, id);

      return tx.operational_expense_barter.findUniqueOrThrow({
        where: { id },
        include: barterInclude(),
      });
    });

    return NextResponse.json(toJsonValue(voided));
  } catch (error) {
    return jsonError(error, "Failed to void operational expense barter.");
  }
}
