import type { PayoutAdjustmentInput, PayoutInput, PayoutTransferInput } from "@/schemas/payout-module";
import type {
  PayoutAdjustmentRecord,
  PayoutBankAccountRecord,
  PayoutChannelRecord,
  PayoutOrderLookupRecord,
  PayoutRecord,
  PayoutTransferRecord,
} from "@/types/payout";
import { requestJson } from "@/lib/request";

export const payoutApi = {
  orders: {
    list: () => requestJson<PayoutOrderLookupRecord[]>("/api/sales/orders"),
  },
  channels: {
    list: () => requestJson<PayoutChannelRecord[]>("/api/sales/channels"),
  },
  bankAccounts: {
    list: () => requestJson<PayoutBankAccountRecord[]>("/api/payout/bank-accounts"),
  },
  records: {
    list: () => requestJson<PayoutRecord[]>("/api/payout/records"),
    create: (payload: PayoutInput) =>
      requestJson<PayoutRecord>("/api/payout/records", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: number, payload: Partial<PayoutInput>) =>
      requestJson<PayoutRecord>(`/api/payout/records/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: number) =>
      requestJson<{ ok: true }>(`/api/payout/records/${id}`, {
        method: "DELETE",
      }),
  },
  adjustments: {
    list: (ref?: string) =>
      requestJson<PayoutAdjustmentRecord[]>(
        ref ? `/api/payout/adjustments?ref=${encodeURIComponent(ref)}` : "/api/payout/adjustments"
      ),
    create: (payload: PayoutAdjustmentInput) =>
      requestJson<PayoutAdjustmentRecord>("/api/payout/adjustments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: number, payload: Partial<PayoutAdjustmentInput>) =>
      requestJson<PayoutAdjustmentRecord>(`/api/payout/adjustments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: number) =>
      requestJson<{ ok: true }>(`/api/payout/adjustments/${id}`, {
        method: "DELETE",
      }),
  },
  transfers: {
    list: () => requestJson<PayoutTransferRecord[]>("/api/payout/transfers"),
    create: (payload: PayoutTransferInput) =>
      requestJson<PayoutTransferRecord>("/api/payout/transfers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<PayoutTransferInput>) =>
      requestJson<PayoutTransferRecord>(`/api/payout/transfers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<{ ok: true }>(`/api/payout/transfers/${id}`, {
        method: "DELETE",
      }),
  },
};
