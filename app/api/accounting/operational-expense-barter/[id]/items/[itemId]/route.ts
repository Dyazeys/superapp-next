import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { recalculateOperationalExpenseBarterTotal } from "@/lib/operational-expense-barter";
import { operationalExpenseBarterItemPatchSchema } from "@/schemas/accounting-module";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_UPDATE);

    const { id, itemId } = await params;
    const payload = operationalExpenseBarterItemPatchSchema.parse(await request.json());

    const updated = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.operational_expense_barter_items.findUnique({
        where: { id: itemId },
        include: {
          operational_expense_barter: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });
      invariant(currentItem, "Barter item was not found.", 404);
      invariant(currentItem.barter_id === id, "Barter item does not belong to this barter.");
      invariant(currentItem.operational_expense_barter.status === "DRAFT", "Only draft barter can be edited.");

      const nextInvCode = payload.inv_code ?? currentItem.inv_code;
      if (payload.inv_code) {
        const inventory = await tx.master_inventory.findUnique({
          where: { inv_code: payload.inv_code },
          select: {
            inv_code: true,
            is_active: true,
          },
        });
        invariant(inventory, "Inventory code was not found.");
        invariant(inventory.is_active, "Barter items require an active inventory item.");
      }

      const nextQty = payload.qty ?? currentItem.qty;
      const nextUnitAmount = payload.unit_amount === undefined ? Number(currentItem.unit_amount) : Number(payload.unit_amount);
      const nextLineAmount = nextQty * nextUnitAmount;

      await tx.operational_expense_barter_items.update({
        where: { id: itemId },
        data: {
          inv_code: nextInvCode,
          qty: nextQty,
          unit_amount: nextUnitAmount.toFixed(2),
          line_amount: nextLineAmount.toFixed(2),
          notes: payload.notes,
          updated_at: new Date(),
        },
      });

      await recalculateOperationalExpenseBarterTotal(tx, id);

      return tx.operational_expense_barter.findUniqueOrThrow({
        where: { id },
        include: barterInclude(),
      });
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to update barter item.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_UPDATE);

    const { id, itemId } = await params;

    const updated = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.operational_expense_barter_items.findUnique({
        where: { id: itemId },
        include: {
          operational_expense_barter: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });
      invariant(currentItem, "Barter item was not found.", 404);
      invariant(currentItem.barter_id === id, "Barter item does not belong to this barter.");
      invariant(currentItem.operational_expense_barter.status === "DRAFT", "Only draft barter can be edited.");

      await tx.operational_expense_barter_items.delete({
        where: { id: itemId },
      });

      await recalculateOperationalExpenseBarterTotal(tx, id);

      return tx.operational_expense_barter.findUniqueOrThrow({
        where: { id },
        include: barterInclude(),
      });
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to delete barter item.");
  }
}
