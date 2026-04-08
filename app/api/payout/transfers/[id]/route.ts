import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { deletePayoutTransferJournal, syncPayoutTransferJournal } from "@/lib/payout-transfer-journal";
import { payoutTransferSchema } from "@/schemas/payout-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

const transferInclude = {
  t_payout: {
    include: {
      t_order: {
        select: {
          order_no: true,
          ref_no: true,
          m_channel: {
            select: {
              channel_id: true,
              channel_name: true,
            },
          },
        },
      },
    },
  },
  accounts: {
    select: {
      id: true,
      code: true,
      name: true,
      normal_balance: true,
    },
  },
} as const;

async function validatePayoutTransferInput(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    payoutId: number;
    amount: string;
    bankAccountId: string;
    excludeTransferId?: string;
  }
) {
  const payout = await tx.t_payout.findUnique({
    where: { payout_id: params.payoutId },
    select: {
      payout_id: true,
      ref: true,
      omset: true,
      t_order: {
        select: {
          m_channel: {
            select: {
              saldo_account_id: true,
            },
          },
        },
      },
    },
  });

  invariant(payout, "Payout was not found.");
  invariant(payout.ref, "Payout must be linked to an order reference.");
  invariant(payout.t_order?.m_channel?.saldo_account_id, "Channel saldo account mapping is missing.");

  const bankAccount = await tx.accounts.findUnique({
    where: { id: params.bankAccountId },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  invariant(bankAccount, "Bank account was not found.");
  invariant(
    bankAccount.code.startsWith("111"),
    `Account ${bankAccount.code} - ${bankAccount.name} is not a valid payout bank account.`
  );

  const aggregate = await tx.payout_transfers.aggregate({
    where: {
      payout_id: params.payoutId,
      ...(params.excludeTransferId
        ? {
            NOT: {
              id: params.excludeTransferId,
            },
          }
        : {}),
    },
    _sum: {
      amount: true,
    },
  });

  const payoutAmount = Number(payout.omset);
  const existingTransferredAmount = Number(aggregate._sum.amount ?? 0);
  const requestedAmount = Number(params.amount);
  const availableAmount = payoutAmount - existingTransferredAmount;

  invariant(requestedAmount > 0, "Transfer amount must be greater than zero.");
  invariant(
    requestedAmount <= availableAmount,
    `Transfer amount exceeds available payout saldo. Remaining available amount is ${availableAmount.toFixed(2)}.`
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = payoutTransferSchema.partial().parse(await request.json());

    const transfer = await prisma.$transaction(async (tx) => {
      const current = await tx.payout_transfers.findUnique({
        where: { id },
        select: {
          id: true,
          payout_id: true,
          amount: true,
          bank_account_id: true,
        },
      });
      invariant(current, "Payout transfer was not found.");

      const nextPayoutId = payload.payout_id ?? current.payout_id;
      const nextAmount = payload.amount ?? String(current.amount);
      const nextBankAccountId = payload.bank_account_id ?? current.bank_account_id;

      await validatePayoutTransferInput(tx, {
        payoutId: nextPayoutId,
        amount: nextAmount,
        bankAccountId: nextBankAccountId,
        excludeTransferId: id,
      });

      await tx.payout_transfers.update({
        where: { id },
        data: {
          payout_id: nextPayoutId,
          transfer_date: payload.transfer_date === undefined ? undefined : asDateOnly(payload.transfer_date),
          amount: nextAmount,
          bank_account_id: payload.bank_account_id,
          notes: payload.notes === undefined ? undefined : payload.notes || null,
          updated_at: new Date(),
        },
      });

      await syncPayoutTransferJournal(tx, id);

      return tx.payout_transfers.findUniqueOrThrow({
        where: { id },
        include: transferInclude,
      });
    });

    return NextResponse.json(toJsonValue(transfer));
  } catch (error) {
    return jsonError(error, "Failed to update payout transfer.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.payout_transfers.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        return;
      }

      await deletePayoutTransferJournal(tx, id);
      await tx.payout_transfers.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete payout transfer.");
  }
}
