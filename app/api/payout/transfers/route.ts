import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { isFailedPayoutStatus } from "@/lib/payout-status";
import { syncPayoutTransferJournal } from "@/lib/payout-transfer-journal";
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
      payout_status: true,
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
  invariant(!isFailedPayoutStatus(payout.payout_status), "Failed payout cannot be transferred to bank.");
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

  return payout;
}

export async function GET() {
  try {
    const transfers = await prisma.payout_transfers.findMany({
      orderBy: [{ transfer_date: "desc" }, { created_at: "desc" }, { id: "desc" }],
      include: transferInclude,
    });

    return NextResponse.json(toJsonValue(transfers));
  } catch (error) {
    return jsonError(error, "Failed to load payout transfers.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = payoutTransferSchema.parse(await request.json());

    const transfer = await prisma.$transaction(async (tx) => {
      await validatePayoutTransferInput(tx, {
        payoutId: payload.payout_id,
        amount: payload.amount,
        bankAccountId: payload.bank_account_id,
      });

      const created = await tx.payout_transfers.create({
        data: {
          payout_id: payload.payout_id,
          transfer_date: asDateOnly(payload.transfer_date),
          amount: payload.amount,
          bank_account_id: payload.bank_account_id,
          notes: payload.notes || null,
        },
      });

      await syncPayoutTransferJournal(tx, created.id);

      return tx.payout_transfers.findUniqueOrThrow({
        where: { id: created.id },
        include: transferInclude,
      });
    });

    return NextResponse.json(toJsonValue(transfer), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create payout transfer.");
  }
}
