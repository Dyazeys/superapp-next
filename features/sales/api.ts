import type { SalesCustomerInput, SalesOrderInput, SalesOrderItemInput } from "@/schemas/sales-module";
import type {
  ChannelLookupRecord,
  SalesCustomerRecord,
  SalesOrderItemRecord,
  SalesOrderListResponse,
  SalesOrderRecord,
} from "@/types/sales";
import { requestJson } from "@/lib/request";

type SalesOrderPostingFilter = "ALL" | "UNPOSTED" | "POSTED" | "NO_POSTING";

export const salesApi = {
  channels: {
    list: () => requestJson<ChannelLookupRecord[]>("/api/sales/channels"),
  },
  customers: {
    list: () => requestJson<SalesCustomerRecord[]>("/api/sales/customers"),
    create: (payload: SalesCustomerInput) =>
      requestJson<SalesCustomerRecord>("/api/sales/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (customerId: number, payload: Partial<SalesCustomerInput>) =>
      requestJson<SalesCustomerRecord>(`/api/sales/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (customerId: number) =>
      requestJson<{ ok: true }>(`/api/sales/customers/${customerId}`, {
        method: "DELETE",
      }),
  },
  orders: {
    list: () => requestJson<SalesOrderRecord[]>("/api/sales/orders"),
    listPaged: (params: {
      page: number;
      page_size: number;
      posting_filter: SalesOrderPostingFilter;
    }) => {
      const query = new URLSearchParams({
        page: String(params.page),
        page_size: String(params.page_size),
        posting_filter: params.posting_filter,
      });
      return requestJson<SalesOrderListResponse>(`/api/sales/orders?${query.toString()}`);
    },
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
    post: (orderNo: string) =>
      requestJson<SalesOrderRecord>(`/api/sales/orders/${encodeURIComponent(orderNo)}/post`, {
        method: "POST",
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
