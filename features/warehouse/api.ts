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
import { requestJson } from "@/lib/request";

export const warehouseApi = {
  vendors: {
    list: () => requestJson<VendorRecord[]>("/api/warehouse/vendors"),
    create: (payload: VendorInput) =>
      requestJson<VendorRecord>("/api/warehouse/vendors", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (vendorCode: string, payload: Partial<VendorInput>) =>
      requestJson<VendorRecord>(`/api/warehouse/vendors/${encodeURIComponent(vendorCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (vendorCode: string) =>
      requestJson<{ ok: true }>(`/api/warehouse/vendors/${encodeURIComponent(vendorCode)}`, {
        method: "DELETE",
      }),
  },
  purchaseOrders: {
    list: () => requestJson<PurchaseOrderRecord[]>("/api/warehouse/purchase-orders"),
    create: (payload: PurchaseOrderInput) =>
      requestJson<PurchaseOrderRecord>("/api/warehouse/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<PurchaseOrderInput>) =>
      requestJson<PurchaseOrderRecord>(`/api/warehouse/purchase-orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<{ ok: true }>(`/api/warehouse/purchase-orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  inbound: {
    list: () => requestJson<InboundDeliveryRecord[]>("/api/warehouse/inbound"),
    create: (payload: InboundDeliveryInput) =>
      requestJson<InboundDeliveryRecord>("/api/warehouse/inbound", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<InboundDeliveryInput>) =>
      requestJson<InboundDeliveryRecord>(`/api/warehouse/inbound/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<{ ok: true }>(`/api/warehouse/inbound/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    items: {
      list: (inboundId: string) =>
        requestJson<InboundItemRecord[]>(`/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items`),
      create: (inboundId: string, payload: Omit<InboundItemInput, "inbound_id">) =>
        requestJson<InboundItemRecord>(`/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (inboundId: string, id: string, payload: Partial<Omit<InboundItemInput, "inbound_id">>) =>
        requestJson<InboundItemRecord>(
          `/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        ),
      remove: (inboundId: string, id: string) =>
        requestJson<{ ok: true }>(
          `/api/warehouse/inbound/${encodeURIComponent(inboundId)}/items/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          }
        ),
    },
  },
  adjustments: {
    list: () => requestJson<AdjustmentRecord[]>("/api/warehouse/adjustments"),
    create: (payload: AdjustmentInput) =>
      requestJson<AdjustmentRecord>("/api/warehouse/adjustments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<AdjustmentInput>) =>
      requestJson<AdjustmentRecord>(`/api/warehouse/adjustments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<{ ok: true }>(`/api/warehouse/adjustments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  stock: {
    balances: () => requestJson<StockBalanceRecord[]>("/api/warehouse/stock-balances"),
    movements: () => requestJson<StockMovementRecord[]>("/api/warehouse/stock-movements"),
  },
};
