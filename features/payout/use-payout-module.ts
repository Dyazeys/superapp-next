"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useModalState } from "@/hooks/use-modal-state";
import { payoutApi } from "@/features/payout/api";
import {
  PAYOUT_ADJUSTMENT_TYPE_OPTIONS,
  PAYOUT_STATUS_OPTIONS,
  payoutAdjustmentSchema,
  payoutSchema,
  type PayoutAdjustmentInput,
  type PayoutInput,
  payoutTransferSchema,
  type PayoutTransferInput,
} from "@/schemas/payout-module";
import type {
  PayoutAdjustmentRecord,
  PayoutBankAccountRecord,
  PayoutChannelRecord,
  PayoutOrderLookupRecord,
  PayoutRecord,
  PayoutTransferRecord,
} from "@/types/payout";

type PayoutFormValues = z.input<typeof payoutSchema>;
type PayoutAdjustmentFormValues = z.input<typeof payoutAdjustmentSchema>;
type PayoutTransferFormValues = z.input<typeof payoutTransferSchema>;

type PayoutsHook = {
  payoutsQuery: UseQueryResult<PayoutRecord[]>;
  payoutForm: UseFormReturn<PayoutFormValues, unknown, PayoutInput>;
  payoutModal: ReturnType<typeof useModalState>;
  editingPayout: PayoutRecord | null;
  openPayoutModal: (payout?: PayoutRecord) => void;
  savePayout: (values: PayoutInput) => Promise<PayoutRecord>;
  deletePayout: (id: number) => Promise<void>;
};

type PayoutAdjustmentsHook = {
  adjustmentsQuery: UseQueryResult<PayoutAdjustmentRecord[]>;
  adjustmentForm: UseFormReturn<PayoutAdjustmentFormValues, unknown, PayoutAdjustmentInput>;
  adjustmentModal: ReturnType<typeof useModalState>;
  editingAdjustment: PayoutAdjustmentRecord | null;
  openAdjustmentModal: (adjustment?: PayoutAdjustmentRecord) => void;
  saveAdjustment: (values: PayoutAdjustmentInput) => Promise<PayoutAdjustmentRecord>;
  deleteAdjustment: (id: number) => Promise<void>;
};

type PayoutTransfersHook = {
  transfersQuery: UseQueryResult<PayoutTransferRecord[]>;
  transferForm: UseFormReturn<PayoutTransferFormValues, unknown, PayoutTransferInput>;
  transferModal: ReturnType<typeof useModalState>;
  editingTransfer: PayoutTransferRecord | null;
  openTransferModal: (transfer?: PayoutTransferRecord) => void;
  saveTransfer: (values: PayoutTransferInput) => Promise<PayoutTransferRecord>;
  deleteTransfer: (id: string) => Promise<void>;
};

const PAYOUT_RECORD_KEY = ["payout-records"] as const;
const PAYOUT_ADJUSTMENT_KEY = ["payout-adjustments"] as const;
const PAYOUT_ORDER_LOOKUP_KEY = ["payout-order-lookup"] as const;
const PAYOUT_CHANNEL_LOOKUP_KEY = ["payout-channel-lookup"] as const;
const PAYOUT_BANK_ACCOUNT_LOOKUP_KEY = ["payout-bank-account-lookup"] as const;
const PAYOUT_TRANSFER_KEY = ["payout-transfers"] as const;
export { PAYOUT_ADJUSTMENT_TYPE_OPTIONS, PAYOUT_STATUS_OPTIONS };

function useBaseMutation(invalidateKeys: ReadonlyArray<ReadonlyArray<unknown>>) {
  const queryClient = useQueryClient();
  return () => Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

function toPayoutStatus(value: string | null | undefined) {
  if (!value) return null;
  return PAYOUT_STATUS_OPTIONS.includes(value as (typeof PAYOUT_STATUS_OPTIONS)[number])
    ? (value as (typeof PAYOUT_STATUS_OPTIONS)[number])
    : null;
}

function toPayoutAdjustmentType(value: string | null | undefined) {
  if (!value) return null;
  return PAYOUT_ADJUSTMENT_TYPE_OPTIONS.includes(value as (typeof PAYOUT_ADJUSTMENT_TYPE_OPTIONS)[number])
    ? (value as (typeof PAYOUT_ADJUSTMENT_TYPE_OPTIONS)[number])
    : null;
}

export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

export function payoutStatusTone(status: string | null | undefined) {
  const value = status?.toUpperCase() ?? "";

  if (value.includes("PAID") || value.includes("DONE") || value.includes("SETTLED")) return "success" as const;
  if (value.includes("PENDING") || value.includes("HOLD")) return "warning" as const;
  if (value.includes("PROCESS")) return "info" as const;
  if (value.includes("CANCEL") || value.includes("FAIL")) return "danger" as const;

  return "neutral" as const;
}

export function sumPayoutFees(
  payout: Pick<
    PayoutRecord,
    "fee_admin" | "fee_service" | "fee_order_process" | "fee_program" | "fee_transaction" | "fee_affiliate"
  >
) {
  return (
    Number(payout.fee_admin) +
    Number(payout.fee_service) +
    Number(payout.fee_order_process) +
    Number(payout.fee_program) +
    Number(payout.fee_transaction) +
    Number(payout.fee_affiliate)
  );
}

export function sumPayoutDeductions(
  payout: Pick<
    PayoutRecord,
    | "seller_discount"
    | "shipping_cost"
    | "fee_admin"
    | "fee_service"
    | "fee_order_process"
    | "fee_program"
    | "fee_transaction"
    | "fee_affiliate"
  >
) {
  return Number(payout.seller_discount) + Number(payout.shipping_cost) + sumPayoutFees(payout);
}

export function usePayoutOrders() {
  return useQuery({
    queryKey: PAYOUT_ORDER_LOOKUP_KEY,
    queryFn: async () => {
      const orders = await payoutApi.orders.list();
      return orders.filter((order) => Boolean(order.ref_no));
    },
  }) as UseQueryResult<PayoutOrderLookupRecord[]>;
}

export function usePayoutChannels() {
  return useQuery({
    queryKey: PAYOUT_CHANNEL_LOOKUP_KEY,
    queryFn: payoutApi.channels.list,
  }) as UseQueryResult<PayoutChannelRecord[]>;
}

export function usePayoutBankAccounts() {
  return useQuery({
    queryKey: PAYOUT_BANK_ACCOUNT_LOOKUP_KEY,
    queryFn: payoutApi.bankAccounts.list,
  }) as UseQueryResult<PayoutBankAccountRecord[]>;
}

export function usePayouts(): PayoutsHook {
  const [editingPayout, setEditingPayout] = useState<PayoutRecord | null>(null);
  const payoutModal = useModalState();
  const payoutForm = useForm<PayoutFormValues, unknown, PayoutInput>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      ref: "",
      payout_date: "",
      qty_produk: 0,
      hpp: "0",
      total_price: "0",
      seller_discount: "0",
      fee_admin: "0",
      fee_service: "0",
      fee_order_process: "0",
      fee_program: "0",
      fee_transaction: "0",
      fee_affiliate: "0",
      shipping_cost: "0",
      omset: "0",
      payout_status: null,
    },
  });
  const payoutsQuery = useQuery({
    queryKey: PAYOUT_RECORD_KEY,
    queryFn: payoutApi.records.list,
  });
  const invalidate = useBaseMutation([PAYOUT_RECORD_KEY, PAYOUT_ADJUSTMENT_KEY]);

  const savePayout = async (values: PayoutInput) => {
    try {
      const action = editingPayout
        ? payoutApi.records.update(editingPayout.payout_id, values)
        : payoutApi.records.create(values);
      const payout = await action;

      toast.success(`Payout ${editingPayout ? "updated" : "created"}`);
      await invalidate();
      setEditingPayout(null);
      payoutModal.closeModal();
      payoutForm.reset();
      return payout;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save payout");
      throw error;
    }
  };

  const deletePayout = async (id: number) => {
    try {
      await payoutApi.records.remove(id);
      toast.success("Payout deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete payout");
      throw error;
    }
  };

  const openPayoutModal = (payout?: PayoutRecord) => {
    setEditingPayout(payout ?? null);
    payoutForm.reset({
      ref: payout?.ref ?? "",
      payout_date: toDateInput(payout?.payout_date),
      qty_produk: payout?.qty_produk ?? 0,
      hpp: payout?.hpp ?? "0",
      total_price: payout?.total_price ?? "0",
      seller_discount: payout?.seller_discount ?? "0",
      fee_admin: payout?.fee_admin ?? "0",
      fee_service: payout?.fee_service ?? "0",
      fee_order_process: payout?.fee_order_process ?? "0",
      fee_program: payout?.fee_program ?? "0",
      fee_transaction: payout?.fee_transaction ?? "0",
      fee_affiliate: payout?.fee_affiliate ?? "0",
      shipping_cost: payout?.shipping_cost ?? "0",
      omset: payout?.omset ?? "0",
      payout_status: toPayoutStatus(payout?.payout_status),
    });
    payoutModal.openModal();
  };

  return {
    payoutsQuery,
    payoutForm,
    payoutModal,
    editingPayout,
    openPayoutModal,
    savePayout,
    deletePayout,
  };
}

export function usePayoutSelection(payouts: PayoutRecord[] | undefined) {
  const [selectedPayoutId, setSelectedPayoutId] = useState<number | null>(null);
  const currentPayoutId = useMemo(
    () => selectedPayoutId ?? payouts?.[0]?.payout_id ?? null,
    [payouts, selectedPayoutId]
  );

  return { selectedPayoutId, currentPayoutId, setSelectedPayoutId };
}

export function usePayoutAdjustments(ref?: string): PayoutAdjustmentsHook {
  const [editingAdjustment, setEditingAdjustment] = useState<PayoutAdjustmentRecord | null>(null);
  const adjustmentModal = useModalState();
  const adjustmentForm = useForm<PayoutAdjustmentFormValues, unknown, PayoutAdjustmentInput>({
    resolver: zodResolver(payoutAdjustmentSchema),
    defaultValues: {
      ref: "",
      payout_date: "",
      adjustment_date: null,
      channel_id: null,
      adjustment_type: null,
      reason: "",
      amount: "0",
    },
  });
  const adjustmentsQuery = useQuery({
    queryKey: [...PAYOUT_ADJUSTMENT_KEY, ref ?? "all"],
    queryFn: () => payoutApi.adjustments.list(ref),
  });
  const invalidate = useBaseMutation([PAYOUT_ADJUSTMENT_KEY, PAYOUT_RECORD_KEY]);

  const saveAdjustment = async (values: PayoutAdjustmentInput) => {
    try {
      const action = editingAdjustment
        ? payoutApi.adjustments.update(editingAdjustment.adjustment_id, values)
        : payoutApi.adjustments.create(values);
      const adjustment = await action;

      toast.success(`Payout adjustment ${editingAdjustment ? "updated" : "created"}`);
      await invalidate();
      setEditingAdjustment(null);
      adjustmentModal.closeModal();
      adjustmentForm.reset();
      return adjustment;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save payout adjustment");
      throw error;
    }
  };

  const deleteAdjustment = async (id: number) => {
    try {
      await payoutApi.adjustments.remove(id);
      toast.success("Payout adjustment deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete payout adjustment");
      throw error;
    }
  };

  const openAdjustmentModal = (adjustment?: PayoutAdjustmentRecord) => {
    setEditingAdjustment(adjustment ?? null);
    adjustmentForm.reset({
      ref: adjustment?.ref ?? "",
      payout_date: toDateInput(adjustment?.payout_date),
      adjustment_date: toDateInput(adjustment?.adjustment_date),
      channel_id: adjustment?.channel_id ?? null,
      adjustment_type: toPayoutAdjustmentType(adjustment?.adjustment_type),
      reason: adjustment?.reason ?? "",
      amount: adjustment?.amount ?? "0",
    });
    adjustmentModal.openModal();
  };

  return {
    adjustmentsQuery,
    adjustmentForm,
    adjustmentModal,
    editingAdjustment,
    openAdjustmentModal,
    saveAdjustment,
    deleteAdjustment,
  };
}

export function usePayoutTransfers(): PayoutTransfersHook {
  const [editingTransfer, setEditingTransfer] = useState<PayoutTransferRecord | null>(null);
  const transferModal = useModalState();
  const transferForm = useForm<PayoutTransferFormValues, unknown, PayoutTransferInput>({
    resolver: zodResolver(payoutTransferSchema),
    defaultValues: {
      payout_id: 0,
      transfer_date: "",
      amount: "0",
      bank_account_id: "",
      notes: "",
    },
  });
  const transfersQuery = useQuery({
    queryKey: PAYOUT_TRANSFER_KEY,
    queryFn: payoutApi.transfers.list,
  });
  const invalidate = useBaseMutation([PAYOUT_TRANSFER_KEY, PAYOUT_RECORD_KEY]);

  const saveTransfer = async (values: PayoutTransferInput) => {
    try {
      const action = editingTransfer
        ? payoutApi.transfers.update(editingTransfer.id, values)
        : payoutApi.transfers.create(values);
      const transfer = await action;

      toast.success(`Payout transfer ${editingTransfer ? "updated" : "created"}`);
      await invalidate();
      setEditingTransfer(null);
      transferModal.closeModal();
      transferForm.reset();
      return transfer;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save payout transfer");
      throw error;
    }
  };

  const deleteTransfer = async (id: string) => {
    try {
      await payoutApi.transfers.remove(id);
      toast.success("Payout transfer deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete payout transfer");
      throw error;
    }
  };

  const openTransferModal = (transfer?: PayoutTransferRecord) => {
    setEditingTransfer(transfer ?? null);
    transferForm.reset({
      payout_id: transfer?.payout_id ?? 0,
      transfer_date: toDateInput(transfer?.transfer_date),
      amount: transfer?.amount ?? "0",
      bank_account_id: transfer?.bank_account_id ?? "",
      notes: transfer?.notes ?? "",
    });
    transferModal.openModal();
  };

  return {
    transfersQuery,
    transferForm,
    transferModal,
    editingTransfer,
    openTransferModal,
    saveTransfer,
    deleteTransfer,
  };
}
