import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import {
  recalculateOperationalExpenseBarterTotal,
  syncOperationalExpenseBarterJournal,
} from "@/lib/operational-expense-barter";
import { syncOperationalExpenseBarterMovements } from "@/lib/warehouse-stock";

function barterInclude() {
  return {
    accounts: {
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
    const session = await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_POST);
    const createdBy = session.user.username;

    const { id } = await params;

    const posted = await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expense_barter.findUnique({
        where: { id },
        include: {
          operational_expense_barter_items: {
            select: {
              inv_code: true,
              qty: true,
            },
          },
        },
      });
      invariant(current, "Operational expense barter was not found.", 404);
      invariant(current.status === "DRAFT", "Only draft barter can be posted.");
      invariant(current.operational_expense_barter_items.length > 0, "Add at least one barter item before posting.");

      const itemTotals = new Map<string, number>();
      current.operational_expense_barter_items.forEach((item) => {
        itemTotals.set(item.inv_code, (itemTotals.get(item.inv_code) ?? 0) + item.qty);
      });

      const invCodes = Array.from(itemTotals.keys());
      const inventories = await tx.master_inventory.findMany({
        where: {
          inv_code: { in: invCodes },
        },
        select: {
          inv_code: true,
          is_active: true,
        },
      });
      const inventoryMap = new Map(inventories.map((row) => [row.inv_code, row]));

      for (const invCode of invCodes) {
        const inventory = inventoryMap.get(invCode);
        invariant(inventory, `Inventory ${invCode} was not found.`);
        invariant(inventory.is_active, `Inventory ${invCode} is inactive.`);
      }

      const balances = await tx.stock_balances.findMany({
        where: {
          inv_code: { in: invCodes },
        },
        select: {
          inv_code: true,
          qty_on_hand: true,
        },
      });
      const balanceMap = new Map(balances.map((row) => [row.inv_code, row.qty_on_hand]));

      for (const [invCode, qty] of itemTotals.entries()) {
        const qtyOnHand = balanceMap.get(invCode) ?? 0;
        invariant(qtyOnHand >= qty, `Stock ${invCode} is not sufficient. Qty on hand ${qtyOnHand}, requested ${qty}.`);
      }

      await recalculateOperationalExpenseBarterTotal(tx, id);

      await tx.operational_expense_barter.update({
        where: { id },
        data: {
          status: "POSTED",
          posted_at: new Date(),
          voided_at: null,
          updated_at: new Date(),
        },
      });

      await syncOperationalExpenseBarterMovements(tx, id);
      await syncOperationalExpenseBarterJournal(tx, id, createdBy);

      return tx.operational_expense_barter.findUniqueOrThrow({
        where: { id },
        include: barterInclude(),
      });
    });

    return NextResponse.json(toJsonValue(posted));
  } catch (error) {
    return jsonError(error, "Failed to post operational expense barter.");
  }
}
