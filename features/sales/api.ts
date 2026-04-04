import type { SalesOrderInput, SalesOrderItemInput } from "@/schemas/sales-module";
import type { ChannelLookupRecord, SalesOrderItemRecord, SalesOrderRecord } from "@/types/sales";
import { requestJson } from "@/lib/request";

export const salesApi = {
  channels: {
    list: () => requestJson<ChannelLookupRecord[]>("/api/sales/channels"),
  },
  orders: {
    list: () => requestJson<SalesOrderRecord[]>("/api/sales/orders"),
    create: (payload: SalesOrderInput) =>
      requestJson<SalesOrderRecord>("/api/sales/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (orderNo: string, payload: Partial<SalesOrderInput>) =>
      requestJson<SalesOrderRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (orderNo: string) =>
      requestJson<{ ok: true }>(`/api/sales/orders/${encodeURIComponent(orderNo)}`, {
        method: "DELETE",
      }),
    items: {
      list: (orderNo: string) =>
        requestJson<SalesOrderItemRecord[]>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items`),
      create: (orderNo: string, payload: Omit<SalesOrderItemInput, "order_no">) =>
        requestJson<SalesOrderItemRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (orderNo: string, id: number, payload: Partial<Omit<SalesOrderItemInput, "order_no">>) =>
        requestJson<SalesOrderItemRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      remove: (orderNo: string, id: number) =>
        requestJson<{ ok: true }>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items/${id}`, {
          method: "DELETE",
        }),
    },
  },
};
