import type { SalesOrderInput, SalesOrderItemInput } from "@/schemas/sales-module";
import type { ChannelLookupRecord, SalesOrderItemRecord, SalesOrderRecord } from "@/types/sales";

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

export const salesApi = {
  channels: {
    list: () => request<ChannelLookupRecord[]>("/api/sales/channels"),
  },
  orders: {
    list: () => request<SalesOrderRecord[]>("/api/sales/orders"),
    create: (payload: SalesOrderInput) =>
      request<SalesOrderRecord>("/api/sales/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (orderNo: string, payload: Partial<SalesOrderInput>) =>
      request<SalesOrderRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (orderNo: string) =>
      request<{ ok: true }>(`/api/sales/orders/${encodeURIComponent(orderNo)}`, {
        method: "DELETE",
      }),
    items: {
      list: (orderNo: string) =>
        request<SalesOrderItemRecord[]>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items`),
      create: (orderNo: string, payload: Omit<SalesOrderItemInput, "order_no">) =>
        request<SalesOrderItemRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (orderNo: string, id: number, payload: Partial<Omit<SalesOrderItemInput, "order_no">>) =>
        request<SalesOrderItemRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      remove: (orderNo: string, id: number) =>
        request<{ ok: true }>(`/api/sales/orders/${encodeURIComponent(orderNo)}/items/${id}`, {
          method: "DELETE",
        }),
    },
  },
};
