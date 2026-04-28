import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { operationalExpenseSchema } from "@/schemas/accounting-module";

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function validateOperationalExpenseBusinessRules(input: {
  payment_account_id: string | null;
}) {
  invariant(input.payment_account_id, "Payment account is required for non-barter opex.");
}

export async function GET(request: NextRequest) {
  try {
    const label = request.nextUrl.searchParams.get("label")?.trim() ?? "";
    const expenseAccountId = request.nextUrl.searchParams.get("expenseAccountId")?.trim() ?? "";

    const expenses = await prisma.operational_expenses.findMany({
      where: {
        is_product_barter: false,
        ...(label ? { expense_label: { contains: label, mode: "insensitive" } } : {}),
        ...(expenseAccountId ? { expense_account_id: expenseAccountId } : {}),
      },
      orderBy: [{ expense_date: "desc" }, { created_at: "desc" }],
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
      take: 200,
    });

    return NextResponse.json(toJsonValue(expenses));
  } catch (error) {
    return jsonError(error, "Failed to load operational expenses.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = operationalExpenseSchema.parse(await request.json());
    invariant(!payload.is_product_barter, "Use Opex Barter module for inventory release / barter transactions.");
    validateOperationalExpenseBusinessRules(payload);

    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.operational_expenses.create({
        data: {
          expense_date: toDateOnly(payload.expense_date),
          expense_account_id: payload.expense_account_id,
          payment_account_id: payload.payment_account_id,
          expense_label: payload.expense_label,
          status: "DRAFT",
          is_product_barter: false,
          qty: 0,
          amount: payload.amount,
          description: payload.description,
          receipt_url: payload.receipt_url,
          inv_code: null,
        },
      });

      return tx.operational_expenses.findUniqueOrThrow({
        where: { id: expense.id },
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

    return NextResponse.json(toJsonValue(created), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create operational expense.");
  }
}
