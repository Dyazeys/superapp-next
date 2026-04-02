import type {
  AdjustmentInput,
  InboundDeliveryInput,
  InboundItemInput,
  PurchaseOrderInput,
  VendorInput,
} from "@/schemas/warehouse-module";
import type {
  AdjustmentRecord,
  InboundDeliveryRecord,
  InboundItemRecord,
  PurchaseOrderRecord,
  StockBalanceRecord,
  StockMovementRecord,
  VendorRecord,
} from "@/types/warehouse";

async function request<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const warehouseApi = {
  vendors: {
    list: () => request<VendorRecord[]>("/api/warehouse/vendors"),
    create: (payload: VendorInput) =>
      request<VendorRecord>("/api/warehouse/vendors", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (vendorCode: string, payload: Partial<VendorInput>) =>
      request<VendorRecord>(`/api/warehouse/vendors/${encodeURIComponent(vendorCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (vendorCode: string) =>
      request<{ ok: true }>(`/api/warehouse/vendors/${encodeURIComponent(vendorCode)}`, {
        method: "DELETE",
      }),
  },
  purchaseOrders: {
    list: () => request<PurchaseOrderRecord[]>("/api/warehouse/purchase-orders"),
    create: (payload: PurchaseOrderInput) =>
      request<PurchaseOrderRecord>("/api/warehouse/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<PurchaseOrderInput>) =>
      request<PurchaseOrderRecord>(`/api/warehouse/purchase-orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<{ ok: true }>(`/api/warehouse/purchase-orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  inbound: {
    list: () => request<InboundDeliveryRecord[]>("/api/warehouse/inbound"),
    create: (payload: InboundDeliveryInput) =>
      request<InboundDeliveryRecord>("/api/warehouse/inbound", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<InboundDeliveryInput>) =>
      request<InboundDeliveryRecord>(`/api/warehouse/inbound/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<{ ok: true }>(`/api/warehouse/inbound/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    items: {
      list: (inboundId: string) =>
        request<InboundItemRecord[]>(`/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items`),
      create: (inboundId: string, payload: Omit<InboundItemInput, "inbound_id">) =>
        request<InboundItemRecord>(`/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (inboundId: string, id: string, payload: Partial<Omit<InboundItemInput, "inbound_id">>) =>
        request<InboundItemRecord>(
          `/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        ),
      remove: (inboundId: string, id: string) =>
        request<{ ok: true }>(
          `/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          }
        ),
    },
  },
  adjustments: {
    list: () => request<AdjustmentRecord[]>("/api/warehouse/adjustments"),
    create: (payload: AdjustmentInput) =>
      request<AdjustmentRecord>("/api/warehouse/adjustments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<AdjustmentInput>) =>
      request<AdjustmentRecord>(`/api/warehouse/adjustments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<{ ok: true }>(`/api/warehouse/adjustments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  stock: {
    balances: () => request<StockBalanceRecord[]>("/api/warehouse/stock-balances"),
    movements: () => request<StockMovementRecord[]>("/api/warehouse/stock-movements"),
  },
};
