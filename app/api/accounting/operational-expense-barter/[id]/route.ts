import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { operationalExpenseBarterPatchSchema } from "@/schemas/accounting-module";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const row = await prisma.operational_expense_barter.findUniqueOrThrow({
      where: { id },
      include: barterInclude(),
    });

    return NextResponse.json(toJsonValue(row));
  } catch (error) {
    return jsonError(error, "Failed to load operational expense barter.");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = operationalExpenseBarterPatchSchema.parse(await request.json());

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expense_barter.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });

      invariant(current, "Operational expense barter was not found.", 404);
      invariant(current.status === "DRAFT", "Only draft barter can be edited.");

      await tx.operational_expense_barter.update({
        where: { id },
        data: {
          barter_date: payload.barter_date ? toDateOnly(payload.barter_date) : undefined,
          expense_account_id: payload.expense_account_id,
          expense_label: payload.expense_label,
          description: payload.description,
          reference_no: payload.reference_no,
          notes_internal: payload.notes_internal,
          updated_at: new Date(),
        },
      });

      return tx.operational_expense_barter.findUniqueOrThrow({
        where: { id },
        include: barterInclude(),
      });
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to update operational expense barter.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expense_barter.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });

      invariant(current, "Operational expense barter was not found.", 404);
      invariant(current.status !== "POSTED", "Posted barter must be voided before deletion.");

      await tx.operational_expense_barter.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete operational expense barter.");
  }
}
