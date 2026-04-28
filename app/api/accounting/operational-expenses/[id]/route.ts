import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { deleteOperationalExpenseJournal, syncOperationalExpenseJournal } from "@/lib/operational-expense-journal";
import { operationalExpensePatchSchema } from "@/schemas/accounting-module";

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function validateOperationalExpenseBusinessRules(input: {
  payment_account_id: string | null;
}) {
  invariant(input.payment_account_id, "Payment account is required for non-barter opex.");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const expense = await prisma.operational_expenses.findUniqueOrThrow({
      where: { id },
      include: {
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
      },
    });

    return NextResponse.json(toJsonValue(expense));
  } catch (error) {
    return jsonError(error, "Failed to load operational expense.");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = operationalExpensePatchSchema.parse(await request.json());

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expenses.findUniqueOrThrow({
        where: { id },
      });
      invariant(!current.is_product_barter, "Legacy barter rows must be handled through the Opex Barter flow.");
      invariant(current.status === "DRAFT", "Only draft opex can be edited.");
      invariant(payload.is_product_barter !== true, "Use Opex Barter module for inventory release / barter transactions.");

      const nextState = {
        expense_date: payload.expense_date ?? current.expense_date.toISOString().slice(0, 10),
        expense_account_id: payload.expense_account_id ?? current.expense_account_id,
        payment_account_id: payload.payment_account_id === undefined ? current.payment_account_id : payload.payment_account_id,
        expense_label: payload.expense_label === undefined ? current.expense_label : payload.expense_label,
        amount: payload.amount ?? current.amount.toString(),
        description: payload.description ?? current.description,
        receipt_url: payload.receipt_url === undefined ? current.receipt_url : payload.receipt_url,
      };

      validateOperationalExpenseBusinessRules({
        payment_account_id: nextState.payment_account_id,
      });

      await tx.operational_expenses.update({
        where: { id },
        data: {
          expense_date: payload.expense_date ? toDateOnly(payload.expense_date) : undefined,
          expense_account_id: payload.expense_account_id,
          payment_account_id: payload.payment_account_id,
          expense_label: payload.expense_label,
          is_product_barter: false,
          status: current.status,
          qty: 0,
          amount: payload.amount,
          description: payload.description,
          receipt_url: payload.receipt_url,
          posted_at: current.posted_at,
          voided_at: current.voided_at,
          inv_code: null,
          updated_at: new Date(),
        },
      });

      await syncOperationalExpenseJournal(tx, id);

      return tx.operational_expenses.findUniqueOrThrow({
        where: { id },
        include: {
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
        },
      });
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to update operational expense.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const current = await tx.operational_expenses.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          is_product_barter: true,
        },
      });

      invariant(current, "Operational expense was not found.", 404);
      invariant(!current.is_product_barter, "Legacy barter rows must be handled through the Opex Barter flow.");
      invariant(current.status === "DRAFT", "Only draft opex can be deleted.");

      await deleteOperationalExpenseJournal(tx, id);
      await tx.operational_expenses.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete operational expense.");
  }
}
