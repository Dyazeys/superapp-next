import type {
  AdjustmentInput,
  CreateWarehouseReturnInput,
  InboundDeliveryInput,
  InboundItemInput,
  PurchaseOrderItemInput,
  PurchaseOrderInput,
  VendorInput,
  VerifyWarehouseReturnInput,
} from "@/schemas/warehouse-module";
import type {
  AdjustmentRecord,
  InboundDeliveryRecord,
  InboundItemRecord,
  PaginatedStockMovements,
  PurchaseOrderItemRecord,
  PurchaseOrderRecord,
  SalesReturnCandidate,
  StockBalanceRecord,
  VendorRecord,
  WarehouseReturn,
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
    bulkRemove: (ids: string[]) =>
      requestJson<{ ok: true; deleted: number }>("/api/warehouse/purchase-orders/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    items: {
      list: (poId: string) =>
        requestJson<PurchaseOrderItemRecord[]>(
          `/api/warehouse/purchase-orders/${encodeURIComponent(poId)}/items`
        ),
      create: (poId: string, payload: Omit<PurchaseOrderItemInput, "po_id">) =>
        requestJson<PurchaseOrderItemRecord>(
          `/api/warehouse/purchase-orders/${encodeURIComponent(poId)}/items`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        ),
      update: (
        poId: string,
        itemId: string,
        payload: Partial<Omit<PurchaseOrderItemInput, "po_id">>
      ) =>
        requestJson<PurchaseOrderItemRecord>(
          `/api/warehouse/purchase-orders/${encodeURIComponent(poId)}/items/${encodeURIComponent(itemId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        ),
      remove: (poId: string, itemId: string) =>
        requestJson<{ ok: true }>(
          `/api/warehouse/purchase-orders/${encodeURIComponent(poId)}/items/${encodeURIComponent(itemId)}`,
          {
            method: "DELETE",
          }
        ),
    },
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
    post: (id: string) =>
      requestJson<InboundDeliveryRecord>(`/api/warehouse/inbound/${encodeURIComponent(id)}/post`, {
        method: "POST",
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
    post: (id: string) =>
      requestJson<AdjustmentRecord>(`/api/warehouse/adjustments/${encodeURIComponent(id)}/post`, {
        method: "POST",
      }),
  },
  stock: {
    balances: () => requestJson<StockBalanceRecord[]>("/api/warehouse/stock-balances"),
    movements: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return requestJson<PaginatedStockMovements>(
        `/api/warehouse/stock-movements${query ? `?${query}` : ""}`
      );
    },
  },
  returns: {
    list: () => requestJson<WarehouseReturn[]>("/api/warehouse/returns"),
    create: (payload: CreateWarehouseReturnInput) =>
      requestJson<WarehouseReturn>("/api/warehouse/returns", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    verify: (id: string, payload: VerifyWarehouseReturnInput) =>
      requestJson<WarehouseReturn>(`/api/warehouse/returns/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    postStock: (id: string) =>
      requestJson<{ warehouseReturn: WarehouseReturn; summary: { posted: number; skipped: number } }>(
        `/api/warehouse/returns/${encodeURIComponent(id)}/post-stock`,
        { method: "POST" },
      ),
    candidates: () =>
      requestJson<SalesReturnCandidate[]>("/api/warehouse/sales-returns/candidates"),
  },
};
