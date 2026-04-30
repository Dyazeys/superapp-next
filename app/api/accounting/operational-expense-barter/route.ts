import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { operationalExpenseBarterSchema } from "@/schemas/accounting-module";

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

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

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_VIEW);

    const rows = await prisma.operational_expense_barter.findMany({
      orderBy: [{ barter_date: "desc" }, { created_at: "desc" }],
      include: barterInclude(),
      take: 200,
    });

    return NextResponse.json(toJsonValue(rows));
  } catch (error) {
    return jsonError(error, "Failed to load operational expense barter records.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.ACCOUNTING_OPEX_BARTER_CREATE);

    const payload = operationalExpenseBarterSchema.parse(await request.json());

    const created = await prisma.operational_expense_barter.create({
      data: {
        barter_date: toDateOnly(payload.barter_date),
        expense_account_id: payload.expense_account_id,
        expense_label: payload.expense_label,
        description: payload.description,
        reference_no: payload.reference_no,
        notes_internal: payload.notes_internal,
      },
      include: barterInclude(),
    });

    return NextResponse.json(toJsonValue(created), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create operational expense barter.");
  }
}
