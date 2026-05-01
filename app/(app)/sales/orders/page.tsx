"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SelectNative } from "@/components/ui/select-native";
import { salesApi } from "@/features/sales/api";
import {
  createEmptySalesItemDraft,
  SALES_STATUS_OPTIONS,
  toDateInput,
  useSalesChannels,
  useSalesCustomers,
  useSalesOrderItems,
  useSalesOrdersInternal,
  useSalesOrderSelection,
  useSalesProductsLookup,
} from "@/features/sales/use-sales-module";
import type { SalesOrderInput } from "@/schemas/sales-module";
import type { SalesOrderItemRecord, SalesOrderRecord } from "@/types/sales";

const orderColumnHelper = createColumnHelper<SalesOrderRecord>();
const itemColumnHelper = createColumnHelper<SalesOrderItemRecord>();

export default function SalesOrdersPage() {
  const hooks = useSalesOrdersInternal({ disableListQuery: true });
  const [selectedOrderNos, setSelectedOrderNos] = useState<string[]>([]);
  const [postingSelected, setPostingSelected] = useState(false);
  const [postingFilter, setPostingFilter] = useState<"ALL" | "UNPOSTED" | "POSTED" | "NO_POSTING">("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const channelsQuery = useSalesChannels();
  const customersQuery = useSalesCustomers();
  const productsQuery = useSalesProductsLookup();

  const { orderForm, orderModal, editingOrder } = hooks;
  const ordersListQuery = useQuery({
    queryKey: ["sales-orders", "paged", { page, pageSize, postingFilter, debouncedSearch }],
    queryFn: () =>
      salesApi.orders.listPaged({
        page,
        page_size: pageSize,
        posting_filter: postingFilter,
        search: debouncedSearch,
      }),
  });
  const allOrderRows = useMemo(() => ordersListQuery.data?.data ?? [], [ordersListQuery.data?.data]);
  const { selectedOrderNo, setSelectedOrderNo } = useSalesOrderSelection(allOrderRows);
  const activeOrderNo = editingOrder?.order_no ?? selectedOrderNo;

  const {
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
  } = useSalesOrderItems(activeOrderNo ?? undefined);

  const totalPages = ordersListQuery.data?.total_pages ?? 1;
  const totalRows = ordersListQuery.data?.total ?? 0;
  const summaryNormalCount = ordersListQuery.data?.summary.normal_count ?? 0;
  const summaryHistoricalCount = ordersListQuery.data?.summary.historical_count ?? 0;

  useEffect(() => {
    setPage(1);
  }, [postingFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchKeyword), 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const orderRows = allOrderRows;
  const activeOrder = orderRows.find((order) => order.order_no === activeOrderNo) ?? editingOrder ?? null;

  const totalOrders = totalRows;
  const historicalOrders = summaryHistoricalCount;
  const normalOrders = summaryNormalCount;
  const totalOrderAmount = allOrderRows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const totalItemRows = allOrderRows.reduce((sum, row) => sum + (row._count?.t_order_item ?? 0), 0);
  const selectedCount = selectedOrderNos.length;

  const skuOptions = (productsQuery.data ?? []).map((product) => ({
    value: product.sku,
    label: `${product.sku} - ${product.product_name}`,
  }));

  const items = itemsQuery.data ?? [];
  const totalItems = items.length;
  const totalLineTotal = items.reduce((sum, item) => sum + Number(item.qty) * Number(item.unit_price), 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount_item), 0);
  const activeOrderAmount = Number(activeOrder?.total_amount ?? 0);
  const totalDifference = totalLineTotal - activeOrderAmount;

  const itemRows = useMemo(() => {
    const rows = itemsQuery.data ?? [];
    if (!itemDraft || editingItemId) {
      return rows;
    }

    return [
      ...rows,
      {
        id: -1,
        order_no: itemDraft.order_no,
        sku: itemDraft.sku || null,
        qty: itemDraft.qty,
        unit_price: itemDraft.unit_price,
        discount_item: itemDraft.discount_item,
        created_at: new Date().toISOString(),
        master_product: itemDraft.sku ? productsQuery.data?.find((product) => product.sku === itemDraft.sku) ?? null : null,
      },
    ];
  }, [editingItemId, itemDraft, itemsQuery.data, productsQuery.data]);

  const isEditingItemRow = (id: number) => editingItemId === id || (id === -1 && !editingItemId && Boolean(itemDraft));

  useEffect(() => {
    const selectable = new Set(
      allOrderRows.filter((row) => !row.is_historical).map((row) => row.order_no)
    );
    setSelectedOrderNos((prev) => prev.filter((orderNo) => selectable.has(orderNo)));
  }, [allOrderRows]);

  const toggleOrderSelection = (orderNo: string) => {
    setSelectedOrderNos((prev) =>
      prev.includes(orderNo) ? prev.filter((current) => current !== orderNo) : [...prev, orderNo]
    );
  };

  const handlePostSelected = async () => {
    if (selectedOrderNos.length === 0 || postingSelected) {
      return;
    }

    const targets = orderRows.filter(
      (row) => selectedOrderNos.includes(row.order_no) && !row.is_historical
    );

    if (targets.length === 0) {
      toast.error("Tidak ada order yang bisa diposting di filter aktif.");
      return;
    }

    try {
      setPostingSelected(true);
      let successCount = 0;
      const failures: Array<{ orderNo: string; error: string }> = [];

      for (const order of targets) {
        const result = await hooks.postOrderStock(order.order_no, { silent: true });
        if (result.ok) {
          successCount += 1;
        } else {
          failures.push({
            orderNo: order.order_no,
            error: result.error ?? "Failed to post sales order stock",
          });
        }
      }

      if (successCount > 0) {
        toast.success(`Post stock selesai: ${successCount} order berhasil.`);
      }

      if (failures.length > 0) {
        const first = failures[0];
        toast.error(
          `Post stock gagal pada ${failures.length} order. Contoh: ${first.orderNo} (${first.error})`
        );
      }

      setSelectedOrderNos(failures.map((failure) => failure.orderNo));
    } finally {
      setPostingSelected(false);
    }
  };

  const orderColumns = [
    orderColumnHelper.accessor("order_no", {
      header: "Order",
      cell: ({ row, getValue }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={`Select order ${row.original.order_no}`}
            disabled={row.original.is_historical}
            className={
              row.original.is_historical
                ? "inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-100"
                : selectedOrderNos.includes(row.original.order_no)
                  ? "inline-flex h-7 w-7 items-center justify-center rounded-md border border-indigo-500 bg-indigo-500 text-white"
                  : "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-transparent hover:border-slate-400"
            }
            onClick={() => toggleOrderSelection(row.original.order_no)}
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            className="text-left font-medium text-blue-600 hover:underline"
            onClick={() => {
              setSelectedOrderNo(row.original.order_no);
              hooks.openOrderModal(row.original);
            }}
          >
            {getValue()}
          </button>
        </div>
      ),
    }),
    orderColumnHelper.accessor("order_date", {
      header: "Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    orderColumnHelper.accessor("channel_id", {
      header: "Channel",
      cell: (info) => info.row.original.m_channel?.channel_name ?? (info.getValue() ?? "-"),
    }),
    orderColumnHelper.accessor("customer_id", {
      header: "Customer",
      cell: (info) => info.row.original.master_customer?.customer_name ?? "Tanpa customer",
    }),
    orderColumnHelper.accessor("total_amount", { header: "Nilai order" }),
    orderColumnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge label={info.getValue()} tone="info" />,
    }),
    orderColumnHelper.accessor("is_historical", {
      header: "Posting",
      cell: (info) => (
        <StatusBadge
          label={
            info.row.original.is_historical
              ? "No posting"
              : info.row.original.posting_summary?.posting_status === "POSTED"
                ? "Posted"
                : info.row.original.posting_summary?.posting_status === "PARTIAL"
                  ? "Partial"
                  : "Unposted"
          }
          tone={
            info.row.original.is_historical
              ? "neutral"
              : info.row.original.posting_summary?.posting_status === "POSTED"
                ? "success"
                : info.row.original.posting_summary?.posting_status === "PARTIAL"
                  ? "warning"
                  : "danger"
          }
        />
      ),
    }),
    orderColumnHelper.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.t_order_item ?? 0} rows`} tone="neutral" />,
    }),
    orderColumnHelper.display({
      id: "actions",
      header: () =>
        selectedCount > 0 ? (
          <div className="flex justify-end">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {selectedCount} selected
            </span>
          </div>
        ) : null,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteOrder(row.original.order_no)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const itemColumns = [
    itemColumnHelper.accessor("sku", {
      header: "SKU",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <SearchableSelect
            value={itemDraft?.sku ?? getValue() ?? ""}
            options={skuOptions}
            placeholder="Search SKU..."
            inputClassName="h-8 min-w-[220px]"
            onValueChange={(next) => setItemDraft((current) => (current ? { ...current, sku: next } : current))}
          />
        ) : (
          <div>
            <p className="font-medium">{getValue() ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{row.original.master_product?.product_name ?? ""}</p>
          </div>
        ),
    }),
    itemColumnHelper.accessor("qty", {
      header: "Qty",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={String(itemDraft?.qty ?? getValue())}
            onChange={(event) => setItemDraft((current) => (current ? { ...current, qty: Number(event.target.value || 0) } : current))}
            className="h-8 w-20"
          />
        ) : (
          getValue()
        ),
    }),
    itemColumnHelper.accessor("unit_price", {
      header: "Unit Price",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={itemDraft?.unit_price ?? getValue()}
            onChange={(event) => setItemDraft((current) => (current ? { ...current, unit_price: event.target.value } : current))}
            className="h-8 w-28"
          />
        ) : (
          getValue()
        ),
    }),
    itemColumnHelper.accessor("discount_item", {
      header: "Diskon mentah",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={itemDraft?.discount_item ?? getValue()}
            onChange={(event) => setItemDraft((current) => (current ? { ...current, discount_item: event.target.value } : current))}
            className="h-8 w-24"
          />
        ) : (
          getValue()
        ),
    }),
      itemColumnHelper.display({
        id: "subtotal_amount",
        header: "Nilai total",
        cell: ({ row }) => {
          const qty = Number(isEditingItemRow(row.original.id) ? itemDraft?.qty ?? row.original.qty : row.original.qty);
          const price = Number(
          isEditingItemRow(row.original.id) ? itemDraft?.unit_price ?? row.original.unit_price : row.original.unit_price
        );
        return (qty * price).toFixed(2);
      },
    }),
    itemColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        isEditingItemRow(row.original.id) ? (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={() => itemDraft && saveItem(itemDraft)}>
              <Save className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={cancelEditingItem}>
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={() => startEditingItem(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={() => deleteItem(row.original.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Sales"
      title="Sales Orders"
      description="Klik nomor pesanan untuk membuka form gabungan order dan item."
    >
      <datalist id="sales-order-nos">
        {allOrderRows.map((order) => (
          <option key={order.order_no} value={order.order_no} />
        ))}
      </datalist>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total orders" value={String(totalOrders)} subtitle="Jumlah order yang terlihat." />
          <MetricCard title="Normal orders" value={String(normalOrders)} subtitle="Order yang mem-posting stok." />
          <MetricCard title="Historical orders" value={String(historicalOrders)} subtitle="Order historis (tanpa posting stok)." />
          <MetricCard
            title="Nilai order terlihat"
            value={totalOrderAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle={`Total item rows: ${totalItemRows}`}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filter</span>
              <SelectNative
                value={postingFilter}
                onChange={(event) => {
                  setPostingFilter(event.target.value as "ALL" | "UNPOSTED" | "POSTED" | "NO_POSTING");
                  setPage(1);
                }}
                className="h-9 w-[220px] rounded-lg border-slate-300 bg-white"
              >
                <option value="ALL">Semua order</option>
                <option value="UNPOSTED">Belum diposting</option>
                <option value="POSTED">Sudah diposting</option>
                <option value="NO_POSTING">Historical (no posting)</option>
              </SelectNative>
              {selectedCount > 0 ? (
                <span className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700">
                  {selectedCount} dipilih
                </span>
              ) : null}
            </div>
            <div className="relative order-3 w-full md:order-2 md:ml-auto md:w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari nomor order / ref..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="h-9 pl-9 pr-9"
              />
              {searchKeyword ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchKeyword("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <div className="order-2 ml-auto flex flex-wrap items-center gap-2 md:order-3">
              <Button
                size="sm"
                variant="secondary"
                className="h-9 px-3.5"
                disabled={selectedCount === 0 || postingSelected}
                onClick={handlePostSelected}
              >
                <Check className="size-4" />
                {selectedCount > 0 ? `Post Stock (${selectedCount})` : "Post Stock"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedOrderNo(null);
                  hooks.openOrderModal();
                }}
                className="h-9 px-3.5"
              >
                <Plus className="size-4" />
                Add sales order
              </Button>
            </div>
          </div>
          {debouncedSearch.trim() && orderRows.length === 0 ? (
            <EmptyState
              title="Order tidak ditemukan"
              description={`Tidak ada order yang cocok dengan "${debouncedSearch}".`}
            />
          ) : (
            <DataTable
              columns={orderColumns}
              data={orderRows}
              emptyMessage="No sales orders found."
              stickyHeader
              maxBodyHeight={520}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">
              {totalRows === 0
                ? "No rows"
                : `Showing ${(page - 1) * pageSize + 1}-${Math.min(totalRows, page * pageSize)} of ${totalRows}`}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500" htmlFor="sales_order_page_size">
                Rows
              </label>
              <select
                id="sales_order_page_size"
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Prev
              </Button>
              <span className="px-1 text-xs text-slate-600">
                {page} / {Math.max(1, totalPages)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ModalFormShell
        open={orderModal.open}
        onOpenChange={orderModal.setOpen}
        title={editingOrder ? `Edit Order ${editingOrder.order_no}` : "Create sales order"}
        description="Form gabungan: header sales order dan order items."
        submitLabel={editingOrder ? "Save order" : "Create order"}
        isSubmitting={orderForm.formState.isSubmitting}
        dialogClassName="gap-0 sm:max-w-[1180px]"
        bodyClassName="space-y-5 bg-white py-5 pr-1 text-slate-900 max-h-[75vh] overflow-y-auto"
        onSubmit={async () => {
          await orderForm.handleSubmit(async (values: SalesOrderInput) => {
            const saved = await hooks.saveOrder(values, { closeOnSuccess: false });
            if (saved) {
              setSelectedOrderNo(saved.order_no);
            }
          })();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Order number" htmlFor="order_no" error={orderForm.formState.errors.order_no?.message}>
            <Input id="order_no" {...orderForm.register("order_no")} disabled={Boolean(editingOrder)} />
          </FormField>
          <FormField label="Order date" htmlFor="order_date" error={orderForm.formState.errors.order_date?.message}>
            <Input id="order_date" type="date" {...orderForm.register("order_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Reference no" htmlFor="ref_no">
            <Input id="ref_no" {...orderForm.register("ref_no")} />
          </FormField>
          <FormField label="Parent order no" htmlFor="parent_order_no">
            <Input id="parent_order_no" list="sales-order-nos" {...orderForm.register("parent_order_no")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Channel id" htmlFor="channel_id">
            <SelectNative
              id="channel_id"
              value={String(orderForm.watch("channel_id") ?? "")}
              onChange={(event) => orderForm.setValue("channel_id", event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Select channel</option>
              {(channelsQuery.data ?? []).map((channel) => (
                <option key={channel.channel_id} value={channel.channel_id}>
                  {channel.channel_name}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField
            label="Customer id (opsional)"
            htmlFor="customer_id"
            helperText={
              (customersQuery.data?.length ?? 0) === 0
                ? "Belum ada customer master. Bisa dikosongkan dulu atau isi dari menu Sales > Customers."
                : "Dipakai terutama untuk order manual/web. Order omnichannel/import boleh dikosongkan."
            }
          >
            <SelectNative
              id="customer_id"
              value={String(orderForm.watch("customer_id") ?? "")}
              onChange={(event) => orderForm.setValue("customer_id", event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">No customer</option>
              {(customersQuery.data ?? []).map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.customer_name}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Nilai order"
            htmlFor="total_amount"
            error={orderForm.formState.errors.total_amount?.message}
            helperText="Nilai dari master order untuk dicocokkan dengan total item."
          >
            <Input id="total_amount" {...orderForm.register("total_amount")} />
          </FormField>
          <FormField label="Status" htmlFor="status" error={orderForm.formState.errors.status?.message}>
            <SelectNative id="status" {...orderForm.register("status")}>
              {SALES_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Historical" htmlFor="is_historical">
            <SelectNative
              id="is_historical"
              value={String(orderForm.watch("is_historical") ?? false)}
              onChange={(event) => orderForm.setValue("is_historical", event.target.value === "true")}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </SelectNative>
          </FormField>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Order Items</p>
              <p className="text-sm text-muted-foreground">
                {activeOrderNo
                  ? `Kelola item untuk order ${activeOrderNo}`
                  : "Simpan order dulu, setelah itu item bisa langsung ditambahkan di sini."}
              </p>
            </div>
            {activeOrderNo ? (
              <Button
                size="sm"
                disabled={actionPending}
                onClick={() => {
                  startNewItem();
                  if (!itemDraft) {
                    setItemDraft(createEmptySalesItemDraft(activeOrderNo));
                  }
                }}
              >
                <Plus className="size-4" />
                Add item
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-white px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Items: {totalItems}</span>
            <span>Nilai order: {activeOrderAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            <span>Nilai total: {totalLineTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            <span className={totalDifference === 0 ? "text-emerald-600" : "text-amber-700"}>
              Selisih: {totalDifference.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </span>
            <span>Diskon mentah: {totalDiscount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            <span>{activeOrder?.is_historical ? "Historical (no stock posting)" : "Normal (posts to stock)"}</span>
          </div>

          {productsQuery.isError ? (
            <EmptyState title="Failed to load products" description={productsQuery.error.message} />
          ) : itemsQuery.isError ? (
            <EmptyState title="Failed to load sales items" description={itemsQuery.error.message} />
          ) : activeOrderNo ? (
            <DataTable columns={itemColumns} data={itemRows} emptyMessage="No sales order items found." />
          ) : (
            <EmptyState title="Order belum disimpan" description="Klik tombol create order dulu, lalu lanjut tambah item di form yang sama." />
          )}
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
