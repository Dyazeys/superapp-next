import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { recalculateOperationalExpenseBarterTotal } from "@/lib/operational-expense-barter";
import { operationalExpenseBarterItemSchema } from "@/schemas/accounting-module";

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_UPDATE);

    const { id } = await params;
    const payload = operationalExpenseBarterItemSchema.parse(await request.json());

    const updated = await prisma.$transaction(async (tx) => {
      const barter = await tx.operational_expense_barter.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });
      invariant(barter, "Operational expense barter was not found.", 404);
      invariant(barter.status === "DRAFT", "Only draft barter can be edited.");

      const inventory = await tx.master_inventory.findUnique({
        where: { inv_code: payload.inv_code },
        select: {
          inv_code: true,
          is_active: true,
        },
      });
      invariant(inventory, "Inventory code was not found.");
      invariant(inventory.is_active, "Barter items require an active inventory item.");

      const qty = payload.qty;
      const unitAmount = Number(payload.unit_amount);
      const lineAmount = qty * unitAmount;

      await tx.operational_expense_barter_items.create({
        data: {
          barter_id: id,
          inv_code: payload.inv_code,
          qty,
          unit_amount: unitAmount.toFixed(2),
          line_amount: lineAmount.toFixed(2),
          notes: payload.notes,
        },
      });

      await recalculateOperationalExpenseBarterTotal(tx, id);

      return tx.operational_expense_barter.findUniqueOrThrow({
        where: { id },
        include: barterInclude(),
      });
    });

    return NextResponse.json(toJsonValue(updated), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create barter item.");
  }
}
