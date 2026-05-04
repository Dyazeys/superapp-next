import type { SalesCustomerInput, SalesOrderInput, SalesOrderItemInput } from "@/schemas/sales-module";
import type {
  ChannelLookupRecord,
  SalesCustomerRecord,
  SalesOrderItemRecord,
  SalesOrderListResponse,
  SalesOrderRecord,
} from "@/types/sales";

export type ImportReviewResult = {
  valid: boolean;
  totalRows: number;
  orderCount: number;
  errors: Array<{ row: number; order_no: string; message: string }>;
};

export type ImportResult = {
  success: boolean;
  orders: number;
  items: number;
  error?: string;
};
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
      search?: string;
    }) => {
      const query = new URLSearchParams({
        page: String(params.page),
        page_size: String(params.page_size),
        posting_filter: params.posting_filter,
      });
      if (params.search?.trim()) {
        query.set("search", params.search.trim());
      }
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
    importCsv: async (file: File, review?: boolean): Promise<ImportResult | ImportReviewResult> => {
      const fd = new FormData();
      fd.append("file", file);
      const params = review ? "?review=1" : "";
      const res = await fetch(`/api/sales/orders/import${params}`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import CSV gagal.");
      return json;
    },
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
