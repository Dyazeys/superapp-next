"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useModalState } from "@/hooks/use-modal-state";
import { salesApi } from "@/features/sales/api";
import {
  salesCustomerSchema,
  salesOrderItemSchema,
  salesOrderSchema,
  SALES_STATUS_OPTIONS,
  type SalesCustomerInput,
  type SalesOrderInput,
  type SalesOrderItemInput,
} from "@/schemas/sales-module";
import type { ChannelLookupRecord, SalesCustomerRecord, SalesOrderItemRecord, SalesOrderRecord } from "@/types/sales";

type ProductLookupRecord = {
  sku: string;
  product_name: string;
  is_active: boolean;
};

type SalesOrderFormValues = Omit<SalesOrderInput, "channel_id" | "customer_id" | "is_historical" | "total_amount"> & {
  channel_id?: unknown;
  customer_id?: unknown;
  total_amount?: string | number;
  is_historical?: boolean;
};

type SalesOrderItemFormValues = Omit<SalesOrderItemInput, "qty"> & {
  qty: unknown;
};

type SalesCustomerFormValues = z.input<typeof salesCustomerSchema>;

type SalesOrdersHook = {
  ordersQuery: UseQueryResult<SalesOrderRecord[]>;
  orderForm: UseFormReturn<SalesOrderFormValues, unknown, SalesOrderInput>;
  orderModal: ReturnType<typeof useModalState>;
  editingOrder: SalesOrderRecord | null;
  openOrderModal: (order?: SalesOrderRecord) => void;
  saveOrder: (
    values: SalesOrderInput,
    options?: {
      closeOnSuccess?: boolean;
    }
  ) => Promise<SalesOrderRecord | null>;
  deleteOrder: (orderNo: string) => Promise<void>;
  postOrderStock: (
    orderNo: string,
    options?: {
      silent?: boolean;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
};

type SalesCustomersHook = {
  customersQuery: UseQueryResult<SalesCustomerRecord[]>;
  customerForm: UseFormReturn<SalesCustomerFormValues, unknown, SalesCustomerInput>;
  customerModal: ReturnType<typeof useModalState>;
  editingCustomer: SalesCustomerRecord | null;
  openCustomerModal: (customer?: SalesCustomerRecord) => void;
  saveCustomer: (values: SalesCustomerInput) => Promise<void>;
  deleteCustomer: (customerId: number) => Promise<void>;
};

export const SALES_BOOLEAN_OPTIONS = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
] as const;
export { SALES_STATUS_OPTIONS };

const SALES_ORDER_KEY = ["sales-orders"] as const;
const SALES_CHANNEL_KEY = ["sales-channels"] as const;
const SALES_CUSTOMER_KEY = ["sales-customers"] as const;
const SALES_PRODUCT_LOOKUP_KEY = ["sales-products-lookup"] as const;
const WAREHOUSE_STOCK_BALANCE_KEY = ["warehouse-stock-balances"] as const;
const WAREHOUSE_STOCK_MOVEMENT_KEY = ["warehouse-stock-movements"] as const;

function useBaseMutation(invalidateKeys: ReadonlyArray<ReadonlyArray<unknown>>) {
  const queryClient = useQueryClient();
  return () => Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

function toSalesStatus(value: string | null | undefined) {
  if (!value) return "PICKUP" as const;
  return SALES_STATUS_OPTIONS.includes(value as (typeof SALES_STATUS_OPTIONS)[number])
    ? (value as (typeof SALES_STATUS_OPTIONS)[number])
    : "PICKUP";
}

export function parseSalesBooleanInput(value: string) {
  return value === "true";
}

export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

export function toDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function createEmptySalesItemDraft(orderNo: string): SalesOrderItemInput {
  return {
    order_no: orderNo,
    sku: "",
    qty: 1,
    unit_price: "0",
    discount_item: "0",
  };
}

export function useSalesChannels() {
  return useQuery({
    queryKey: SALES_CHANNEL_KEY,
    queryFn: salesApi.channels.list,
  }) as UseQueryResult<ChannelLookupRecord[]>;
}

export function useSalesCustomers() {
  return useQuery({
    queryKey: SALES_CUSTOMER_KEY,
    queryFn: salesApi.customers.list,
  }) as UseQueryResult<SalesCustomerRecord[]>;
}

export function useSalesProductsLookup() {
  return useQuery({
    queryKey: SALES_PRODUCT_LOOKUP_KEY,
    queryFn: async () => {
      const response = await fetch("/api/product/products");
      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const products = (await response.json()) as ProductLookupRecord[];
      return products.filter((product) => product.is_active);
    },
  });
}

export function useSalesOrders(): SalesOrdersHook {
  return useSalesOrdersInternal();
}

export function useSalesOrdersInternal(options?: { disableListQuery?: boolean }): SalesOrdersHook {
  const [editingOrder, setEditingOrder] = useState<SalesOrderRecord | null>(null);
  const orderModal = useModalState();
  const orderForm = useForm<SalesOrderFormValues, unknown, SalesOrderInput>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      order_no: "",
      order_date: "",
      ref_no: "",
      parent_order_no: "",
      channel_id: null,
      customer_id: null,
      total_amount: "0",
      status: "PICKUP",
      is_historical: false,
    },
  });
  const ordersQuery = useQuery({
    queryKey: SALES_ORDER_KEY,
    queryFn: salesApi.orders.list,
    enabled: !(options?.disableListQuery ?? false),
  });
  const invalidate = useBaseMutation([
    SALES_ORDER_KEY,
    SALES_CUSTOMER_KEY,
    ["sales-order-items"],
    WAREHOUSE_STOCK_BALANCE_KEY,
    WAREHOUSE_STOCK_MOVEMENT_KEY,
  ]);

  const saveOrder = async (
    values: SalesOrderInput,
    options?: {
      closeOnSuccess?: boolean;
    }
  ) => {
    const closeOnSuccess = options?.closeOnSuccess ?? true;

    try {
      const action = editingOrder ? salesApi.orders.update(editingOrder.order_no, values) : salesApi.orders.create(values);
      const order = await action;
      toast.success(`Sales order ${editingOrder ? "updated" : "created"}`);
      await invalidate();

      if (closeOnSuccess) {
        orderModal.closeModal();
        setEditingOrder(null);
        orderForm.reset();
      } else {
        setEditingOrder(order);
        orderForm.reset({
          order_no: order.order_no,
          order_date: toDateInput(order.order_date),
          ref_no: order.ref_no ?? "",
          parent_order_no: order.parent_order_no ?? "",
          channel_id: order.channel_id ?? null,
          customer_id: order.customer_id ?? null,
          total_amount: order.total_amount ?? "0",
          status: toSalesStatus(order.status),
          is_historical: order.is_historical ?? false,
        });
      }

      return order;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save sales order");
      return null;
    }
  };

  const deleteOrder = async (orderNo: string) => {
    try {
      await salesApi.orders.remove(orderNo);
      toast.success("Sales order deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete sales order");
    }
  };

  const postOrderStock = async (
    orderNo: string,
    options?: {
      silent?: boolean;
    }
  ) => {
    const silent = options?.silent ?? false;
    try {
      await salesApi.orders.post(orderNo);
      if (!silent) {
        toast.success("Sales order stock posted");
      }
      await invalidate();
      return { ok: true as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post sales order stock";
      if (!silent) {
        toast.error(message);
      }
      return { ok: false as const, error: message };
    }
  };

  const openOrderModal = (order?: SalesOrderRecord) => {
    setEditingOrder(order ?? null);
    orderForm.reset({
      order_no: order?.order_no ?? "",
      order_date: toDateInput(order?.order_date),
      ref_no: order?.ref_no ?? "",
      parent_order_no: order?.parent_order_no ?? "",
      channel_id: order?.channel_id ?? null,
      customer_id: order?.customer_id ?? null,
      total_amount: order?.total_amount ?? "0",
      status: toSalesStatus(order?.status),
      is_historical: order?.is_historical ?? false,
    });
    orderModal.openModal();
  };

  return {
    ordersQuery,
    orderForm,
    orderModal,
    editingOrder,
    openOrderModal,
    saveOrder,
    deleteOrder,
    postOrderStock,
  };
}

export function useSalesCustomerMaster(): SalesCustomersHook {
  const [editingCustomer, setEditingCustomer] = useState<SalesCustomerRecord | null>(null);
  const customerForm = useForm<SalesCustomerFormValues, unknown, SalesCustomerInput>({
    resolver: zodResolver(salesCustomerSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      email: "",
      is_active: true,
    },
  });
  const customerModal = useModalState();
  const customersQuery = useSalesCustomers();
  const invalidate = useBaseMutation([SALES_CUSTOMER_KEY, SALES_ORDER_KEY]);

  const saveCustomer = async (values: SalesCustomerInput) => {
    try {
      if (editingCustomer) {
        await salesApi.customers.update(editingCustomer.customer_id, values);
      } else {
        await salesApi.customers.create(values);
      }

      toast.success(`Customer ${editingCustomer ? "updated" : "created"}`);
      await invalidate();
      setEditingCustomer(null);
      customerModal.closeModal();
      customerForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save customer");
    }
  };

  const deleteCustomer = async (customerId: number) => {
    try {
      await salesApi.customers.remove(customerId);
      toast.success("Customer deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete customer");
    }
  };

  const openCustomerModal = (customer?: SalesCustomerRecord) => {
    setEditingCustomer(customer ?? null);
    customerForm.reset({
      customer_name: customer?.customer_name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      is_active: customer?.is_active ?? true,
    });
    customerModal.openModal();
  };

  return {
    customersQuery,
    customerForm,
    customerModal,
    editingCustomer,
    openCustomerModal,
    saveCustomer,
    deleteCustomer,
  };
}

export function useSalesOrderSelection(orders: SalesOrderRecord[] | undefined) {
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const currentOrderNo = useMemo(() => selectedOrderNo ?? orders?.[0]?.order_no ?? null, [orders, selectedOrderNo]);

  return { selectedOrderNo, currentOrderNo, setSelectedOrderNo };
}

export function useSalesOrderItems(selectedOrderNo?: string) {
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<SalesOrderItemInput | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const itemsQuery = useQuery({
    queryKey: ["sales-order-items", selectedOrderNo],
    queryFn: () => salesApi.orders.items.list(selectedOrderNo!),
    enabled: Boolean(selectedOrderNo),
  });
  const invalidate = useBaseMutation([
    ["sales-order-items", selectedOrderNo],
    SALES_ORDER_KEY,
    WAREHOUSE_STOCK_BALANCE_KEY,
    WAREHOUSE_STOCK_MOVEMENT_KEY,
  ]);

  const saveItem = async (payload: SalesOrderItemInput) => {
    if (!selectedOrderNo) {
      throw new Error("Select an order first");
    }
    if (actionPending) {
      return;
    }

    try {
      setActionPending(true);
      const validated = salesOrderItemSchema.parse(payload) as SalesOrderItemFormValues & SalesOrderItemInput;
      const body = Object.fromEntries(Object.entries(validated).filter(([key]) => key !== "order_no")) as Omit<
        SalesOrderItemInput,
        "order_no"
      >;

      if (editingItemId) {
        await salesApi.orders.items.update(selectedOrderNo, editingItemId, body);
      } else {
        await salesApi.orders.items.create(selectedOrderNo, body);
      }

      toast.success(`Sales item ${editingItemId ? "updated" : "created"}`);
      await invalidate();
      setEditingItemId(null);
      setItemDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save sales item");
    } finally {
      setActionPending(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!selectedOrderNo) {
      return;
    }
    if (actionPending) {
      return;
    }

    try {
      setActionPending(true);
      await salesApi.orders.items.remove(selectedOrderNo, id);
      toast.success("Sales item deleted");
      await invalidate();
      setEditingItemId(null);
      setItemDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete sales item");
    } finally {
      setActionPending(false);
    }
  };

  const startNewItem = () => {
    if (!selectedOrderNo) {
      return;
    }

    setEditingItemId(null);
    setItemDraft(createEmptySalesItemDraft(selectedOrderNo));
  };

  const startEditingItem = (item: SalesOrderItemRecord) => {
    setEditingItemId(item.id);
    setItemDraft({
      order_no: item.order_no ?? selectedOrderNo ?? "",
      sku: item.sku ?? "",
      qty: item.qty,
      unit_price: item.unit_price,
      discount_item: item.discount_item,
    });
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setItemDraft(null);
  };

  return {
    itemsQuery,
    editingItemId,
    itemDraft,
    setItemDraft,
    saveItem,
    deleteItem,
    startNewItem,
    startEditingItem,
    cancelEditingItem,
    actionPending,
  };
}
