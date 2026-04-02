/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salesApi } from "@/features/sales/api";
import { useModalState } from "@/hooks/use-modal-state";
import { salesOrderSchema, type SalesOrderInput, type SalesOrderItemInput } from "@/schemas/sales-module";
import type { ChannelLookupRecord, SalesOrderItemRecord, SalesOrderRecord } from "@/types/sales";

const orderColumnHelper = createColumnHelper<SalesOrderRecord>();
const itemColumnHelper = createColumnHelper<SalesOrderItemRecord>();

function asBool(value: string) {
  return value === "true";
}

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function emptyItemDraft(orderNo: string): SalesOrderItemInput {
  return {
    order_no: orderNo,
    sku: null,
    qty: 1,
    unit_price: "0",
    discount_item: "0",
  };
}

export function SalesWorkspace() {
  const queryClient = useQueryClient();
  const orderModal = useModalState();

  const [editingOrder, setEditingOrder] = useState<SalesOrderRecord | null>(null);
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<SalesOrderItemInput | null>(null);

  const ordersQuery = useQuery({ queryKey: ["sales-orders"], queryFn: salesApi.orders.list });
  const channelsQuery = useQuery({ queryKey: ["sales-channels"], queryFn: salesApi.channels.list });
  const productsQuery = useQuery({
    queryKey: ["sales-products-lookup"],
    queryFn: async () => {
      const response = await fetch("/api/product/products");
      if (!response.ok) throw new Error("Failed to load products");
      return (await response.json()) as Array<{ sku: string; product_name: string }>;
    },
  });
  const itemsQuery = useQuery({
    queryKey: ["sales-order-items", selectedOrderNo],
    queryFn: () => salesApi.orders.items.list(selectedOrderNo!),
    enabled: Boolean(selectedOrderNo),
  });

  useEffect(() => {
    if (!selectedOrderNo && ordersQuery.data?.length) {
      setSelectedOrderNo(ordersQuery.data[0].order_no);
    }
  }, [ordersQuery.data, selectedOrderNo]);

  const orderForm = useForm({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      order_no: "",
      order_date: "",
      ref_no: "",
      parent_order_no: "",
      channel_id: null,
      customer_id: null,
      total_amount: "0",
      status: "PAID",
      is_historical: false,
    },
  });

  async function invalidateAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["sales-order-items"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock-balances"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock-movements"] }),
    ]);
  }

  const orderMutation = useMutation({
    mutationFn: (payload: SalesOrderInput) =>
      editingOrder ? salesApi.orders.update(editingOrder.order_no, payload) : salesApi.orders.create(payload),
    onSuccess: async (order) => {
      toast.success(`Sales order ${editingOrder ? "updated" : "created"}`);
      await invalidateAll();
      orderModal.closeModal();
      setEditingOrder(null);
      setSelectedOrderNo(order.order_no);
      orderForm.reset();
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: salesApi.orders.remove,
    onSuccess: async () => {
      toast.success("Sales order deleted");
      await invalidateAll();
      setSelectedOrderNo(null);
      setEditingItemId(null);
      setItemDraft(null);
    },
  });

  const itemMutation = useMutation({
    mutationFn: (payload: SalesOrderItemInput) => {
      if (!selectedOrderNo) throw new Error("Select an order first");
      const body = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "order_no")) as Omit<SalesOrderItemInput, "order_no">;
      return editingItemId
        ? salesApi.orders.items.update(selectedOrderNo, editingItemId, body)
        : salesApi.orders.items.create(selectedOrderNo, body);
    },
    onSuccess: async () => {
      toast.success(`Sales item ${editingItemId ? "updated" : "created"}`);
      await invalidateAll();
      setEditingItemId(null);
      setItemDraft(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ orderNo, id }: { orderNo: string; id: number }) => salesApi.orders.items.remove(orderNo, id),
    onSuccess: async () => {
      toast.success("Sales item deleted");
      await invalidateAll();
      setEditingItemId(null);
      setItemDraft(null);
    },
  });

  const openOrderModal = useCallback((order?: SalesOrderRecord) => {
    setEditingOrder(order ?? null);
    orderForm.reset({
      order_no: order?.order_no ?? "",
      order_date: toDateTimeInput(order?.order_date),
      ref_no: order?.ref_no ?? "",
      parent_order_no: order?.parent_order_no ?? "",
      channel_id: order?.channel_id ?? null,
      customer_id: order?.customer_id ?? null,
      total_amount: order?.total_amount ?? "0",
      status: order?.status ?? "PAID",
      is_historical: order?.is_historical ?? false,
    });
    orderModal.openModal();
  }, [orderForm, orderModal]);

  const selectedOrder = useMemo(
    () => (ordersQuery.data ?? []).find((order) => order.order_no === selectedOrderNo) ?? null,
    [ordersQuery.data, selectedOrderNo]
  );

  const orderColumns = useMemo(
    () => [
      orderColumnHelper.accessor("order_no", {
        header: "Order",
        cell: ({ row, getValue }) => <button type="button" className="font-medium text-left" onClick={() => setSelectedOrderNo(row.original.order_no)}>{getValue()}</button>,
      }),
      orderColumnHelper.accessor("order_date", { header: "Date", cell: (info) => toDateInput(info.getValue()) }),
      orderColumnHelper.accessor("channel_id", {
        header: "Channel",
        cell: (info) => info.row.original.m_channel?.channel_name ?? (info.getValue() ?? "-"),
      }),
      orderColumnHelper.accessor("total_amount", { header: "Total" }),
      orderColumnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge label={info.getValue()} tone="info" /> }),
      orderColumnHelper.accessor("is_historical", {
        header: "Posting",
        cell: (info) => <StatusBadge label={info.getValue() ? "Historical" : "Normal"} tone={info.getValue() ? "neutral" : "warning"} />,
      }),
      orderColumnHelper.display({
        id: "items",
        header: "Items",
        cell: ({ row }) => <StatusBadge label={`${row.original._count?.t_order_item ?? 0} rows`} tone="neutral" />,
      }),
      orderColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openOrderModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteOrderMutation.mutate(row.original.order_no)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteOrderMutation, openOrderModal]
  );

  const itemRows = useMemo(() => {
    const rows = itemsQuery.data ?? [];
    if (!itemDraft || editingItemId) return rows;
    return [{
      id: -1,
      order_no: itemDraft.order_no,
      sku: itemDraft.sku ?? null,
      qty: itemDraft.qty,
      unit_price: itemDraft.unit_price,
      discount_item: itemDraft.discount_item,
      created_at: new Date().toISOString(),
      master_product: itemDraft.sku ? productsQuery.data?.find((product) => product.sku === itemDraft.sku) ?? null : null,
    }, ...rows];
  }, [editingItemId, itemDraft, itemsQuery.data, productsQuery.data]);

  const isEditingItemRow = useCallback(
    (id: number) => editingItemId === id || (id === -1 && !editingItemId && Boolean(itemDraft)),
    [editingItemId, itemDraft]
  );

  const itemColumns = useMemo(
    () => [
      itemColumnHelper.accessor("sku", {
        header: "SKU",
        cell: ({ row, getValue }) => isEditingItemRow(row.original.id) ? (
          <Input list="sales-product-skus" value={itemDraft?.sku ?? getValue() ?? ""} onChange={(e) => setItemDraft((current) => current ? { ...current, sku: e.target.value || null } : current)} className="h-8 min-w-[170px]" />
        ) : (
          <div><p className="font-medium">{getValue() ?? "-"}</p><p className="text-xs text-muted-foreground">{row.original.master_product?.product_name ?? ""}</p></div>
        ),
      }),
      itemColumnHelper.accessor("qty", {
        header: "Qty",
        cell: ({ row, getValue }) => isEditingItemRow(row.original.id) ? (
          <Input value={String(itemDraft?.qty ?? getValue())} onChange={(e) => setItemDraft((current) => current ? { ...current, qty: Number(e.target.value || 0) } : current)} className="h-8 w-20" />
        ) : getValue(),
      }),
      itemColumnHelper.accessor("unit_price", {
        header: "Unit Price",
        cell: ({ row, getValue }) => isEditingItemRow(row.original.id) ? (
          <Input value={itemDraft?.unit_price ?? getValue()} onChange={(e) => setItemDraft((current) => current ? { ...current, unit_price: e.target.value } : current)} className="h-8 w-28" />
        ) : getValue(),
      }),
      itemColumnHelper.accessor("discount_item", {
        header: "Discount",
        cell: ({ row, getValue }) => isEditingItemRow(row.original.id) ? (
          <Input value={itemDraft?.discount_item ?? getValue()} onChange={(e) => setItemDraft((current) => current ? { ...current, discount_item: e.target.value } : current)} className="h-8 w-24" />
        ) : getValue(),
      }),
      itemColumnHelper.display({
        id: "net_amount",
        header: "Net",
        cell: ({ row }) => {
          const qty = Number(isEditingItemRow(row.original.id) ? itemDraft?.qty ?? row.original.qty : row.original.qty);
          const price = Number(isEditingItemRow(row.original.id) ? itemDraft?.unit_price ?? row.original.unit_price : row.original.unit_price);
          const discount = Number(isEditingItemRow(row.original.id) ? itemDraft?.discount_item ?? row.original.discount_item : row.original.discount_item);
          return (qty * price - discount).toFixed(2);
        },
      }),
      itemColumnHelper.display({
        id: "stock_effect",
        header: "Stock",
        cell: () => <StatusBadge label={selectedOrder?.is_historical ? "No posting" : "Posts to stock"} tone={selectedOrder?.is_historical ? "neutral" : "warning"} />,
      }),
      itemColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => isEditingItemRow(row.original.id) ? (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => itemDraft && itemMutation.mutate(itemDraft)}><Save className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => { setEditingItemId(null); setItemDraft(null); }}><X className="size-3.5" /></Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => { setEditingItemId(row.original.id); setItemDraft({ order_no: row.original.order_no ?? selectedOrderNo ?? "", sku: row.original.sku, qty: row.original.qty, unit_price: row.original.unit_price, discount_item: row.original.discount_item }); }}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => selectedOrderNo && deleteItemMutation.mutate({ orderNo: selectedOrderNo, id: row.original.id })}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteItemMutation, isEditingItemRow, itemDraft, itemMutation, selectedOrder?.is_historical, selectedOrderNo]
  );

  return (
    <div className="space-y-6">
      <datalist id="sales-channel-ids">{(channelsQuery.data ?? []).map((channel: ChannelLookupRecord) => <option key={channel.channel_id} value={channel.channel_id}>{channel.channel_name}</option>)}</datalist>
      <datalist id="sales-product-skus">{(productsQuery.data ?? []).map((product) => <option key={product.sku} value={product.sku}>{product.product_name}</option>)}</datalist>
      <datalist id="sales-boolean-values"><option value="true" /><option value="false" /></datalist>
      <datalist id="sales-status-values"><option value="PAID" /><option value="PICKUP" /><option value="OPEN" /><option value="CANCELLED" /></datalist>
      <datalist id="sales-order-nos">{(ordersQuery.data ?? []).map((order) => <option key={order.order_no} value={order.order_no} />)}</datalist>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1.1fr]">
        <WorkspacePanel title="Sales Orders" description="Normal orders post stock through warehouse movements. Historical orders stay ledger-neutral.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openOrderModal()}><Plus className="size-4" />Add sales order</Button></div>
            <DataTable columns={orderColumns} data={ordersQuery.data ?? []} emptyMessage="No sales orders found." />
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Sales Order Items" description="Inline item editing recalculates totals and re-syncs stock posting from active stock-tracked BOM rows.">
          {selectedOrderNo ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{selectedOrderNo}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder ? `${selectedOrder.status} • ${selectedOrder.is_historical ? "Historical order, no stock movement" : "Normal order, posts stock"}` : "Selected order"}</p>
                </div>
                <Button size="sm" onClick={() => selectedOrderNo && setItemDraft(emptyItemDraft(selectedOrderNo))}><Plus className="size-4" />Add item</Button>
              </div>
              <DataTable columns={itemColumns} data={itemRows} emptyMessage="No sales order items found." />
            </div>
          ) : (
            <EmptyState title="Select a sales order" description="Choose an order from the left table to maintain its inline order items." />
          )}
        </WorkspacePanel>
      </section>

      <WorkspacePanel title="Stock Posting Rule" description="Sales posts one or more warehouse movement rows per order item based on active stock-tracked BOM components. Historical orders skip posting entirely.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-medium">Normal order</p>
            <p className="mt-2 text-sm text-muted-foreground">Creates `SALE` movements with negative quantities from active stock-tracked BOM rows.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-medium">Historical order</p>
            <p className="mt-2 text-sm text-muted-foreground">Creates no `SALE` movements and removes any existing posting if the order is switched to historical.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-medium">Duplicate prevention</p>
            <p className="mt-2 text-sm text-muted-foreground">Posting is rebuilt from `reference_type = SALE` and `reference_id = order item id`, so the same item cannot post twice.</p>
          </div>
        </div>
      </WorkspacePanel>

      <ModalFormShell open={orderModal.open} onOpenChange={orderModal.setOpen} title={editingOrder ? "Edit sales order" : "Create sales order"} description="Modal CRUD flow for sales order headers." submitLabel={editingOrder ? "Save changes" : "Create sales order"} onSubmit={orderForm.handleSubmit((values) => orderMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Order number" htmlFor="order_no" error={orderForm.formState.errors.order_no?.message}><Input id="order_no" {...orderForm.register("order_no")} disabled={Boolean(editingOrder)} /></FormField>
          <FormField label="Order date" htmlFor="order_date" error={orderForm.formState.errors.order_date?.message}><Input id="order_date" type="datetime-local" {...orderForm.register("order_date")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Reference no" htmlFor="ref_no"><Input id="ref_no" {...orderForm.register("ref_no")} /></FormField>
          <FormField label="Parent order no" htmlFor="parent_order_no"><Input id="parent_order_no" list="sales-order-nos" {...orderForm.register("parent_order_no")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Channel id" htmlFor="channel_id"><Input id="channel_id" list="sales-channel-ids" value={orderForm.watch("channel_id") == null ? "" : String(orderForm.watch("channel_id"))} onChange={(e) => orderForm.setValue("channel_id", e.target.value ? Number(e.target.value) : null)} /></FormField>
          <FormField label="Customer id" htmlFor="customer_id"><Input id="customer_id" value={orderForm.watch("customer_id") == null ? "" : String(orderForm.watch("customer_id"))} onChange={(e) => orderForm.setValue("customer_id", e.target.value ? Number(e.target.value) : null)} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Total amount" htmlFor="total_amount" error={orderForm.formState.errors.total_amount?.message}><Input id="total_amount" {...orderForm.register("total_amount")} /></FormField>
          <FormField label="Status" htmlFor="status" error={orderForm.formState.errors.status?.message}><Input id="status" list="sales-status-values" {...orderForm.register("status")} /></FormField>
          <FormField label="Historical" htmlFor="is_historical"><Input id="is_historical" list="sales-boolean-values" value={String(orderForm.watch("is_historical"))} onChange={(e) => orderForm.setValue("is_historical", asBool(e.target.value))} /></FormField>
        </div>
      </ModalFormShell>
    </div>
  );
}
