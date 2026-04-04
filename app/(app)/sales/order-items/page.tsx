"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEmptySalesItemDraft,
  useSalesOrderItems,
  useSalesOrders,
  useSalesOrderSelection,
  useSalesProductsLookup,
} from "@/features/sales/use-sales-module";
import type { SalesOrderItemRecord } from "@/types/sales";

const columnHelper = createColumnHelper<SalesOrderItemRecord>();

export default function SalesOrderItemsPage() {
  const { ordersQuery } = useSalesOrders();
  const productsQuery = useSalesProductsLookup();
  const { selectedOrderNo, currentOrderNo, setSelectedOrderNo } = useSalesOrderSelection(ordersQuery.data);
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
  } = useSalesOrderItems(currentOrderNo ?? undefined);

  const selectedOrder = (ordersQuery.data ?? []).find((order) => order.order_no === currentOrderNo) ?? null;
  const items = itemsQuery.data ?? [];
  const totalItems = items.length;
  const totalGross = items.reduce((sum, item) => sum + Number(item.qty) * Number(item.unit_price), 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount_item), 0);
  const totalNet = totalGross - totalDiscount;

  const itemRows = useMemo(() => {
    const rows = itemsQuery.data ?? [];
    if (!itemDraft || editingItemId) {
      return rows;
    }

    return [
      {
        id: -1,
        order_no: itemDraft.order_no,
        sku: itemDraft.sku || null,
        qty: itemDraft.qty,
        unit_price: itemDraft.unit_price,
        discount_item: itemDraft.discount_item,
        created_at: new Date().toISOString(),
        master_product: itemDraft.sku
          ? productsQuery.data?.find((product) => product.sku === itemDraft.sku) ?? null
          : null,
      },
      ...rows,
    ];
  }, [editingItemId, itemDraft, itemsQuery.data, productsQuery.data]);

  const isEditingItemRow = (id: number) => editingItemId === id || (id === -1 && !editingItemId && Boolean(itemDraft));

  const columns = [
    columnHelper.accessor("sku", {
      header: "SKU",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            list="sales-item-product-skus"
            value={itemDraft?.sku ?? getValue() ?? ""}
            onChange={(event) =>
              setItemDraft((current) => (current ? { ...current, sku: event.target.value } : current))
            }
            className="h-8 min-w-[170px]"
          />
        ) : (
          <div>
            <p className="font-medium">{getValue() ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{row.original.master_product?.product_name ?? ""}</p>
          </div>
        ),
    }),
    columnHelper.accessor("qty", {
      header: "Qty",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={String(itemDraft?.qty ?? getValue())}
            onChange={(event) =>
              setItemDraft((current) => (current ? { ...current, qty: Number(event.target.value || 0) } : current))
            }
            className="h-8 w-20"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("unit_price", {
      header: "Unit Price",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={itemDraft?.unit_price ?? getValue()}
            onChange={(event) =>
              setItemDraft((current) => (current ? { ...current, unit_price: event.target.value } : current))
            }
            className="h-8 w-28"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("discount_item", {
      header: "Discount",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={itemDraft?.discount_item ?? getValue()}
            onChange={(event) =>
              setItemDraft((current) => (current ? { ...current, discount_item: event.target.value } : current))
            }
            className="h-8 w-24"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.display({
      id: "net_amount",
      header: "Net",
      cell: ({ row }) => {
        const qty = Number(isEditingItemRow(row.original.id) ? itemDraft?.qty ?? row.original.qty : row.original.qty);
        const price = Number(
          isEditingItemRow(row.original.id) ? itemDraft?.unit_price ?? row.original.unit_price : row.original.unit_price
        );
        const discount = Number(
          isEditingItemRow(row.original.id)
            ? itemDraft?.discount_item ?? row.original.discount_item
            : row.original.discount_item
        );
        return (qty * price - discount).toFixed(2);
      },
    }),
    columnHelper.display({
      id: "stock_effect",
      header: "Stock",
      cell: () => (
        <StatusBadge
          label={selectedOrder?.is_historical ? "No posting" : "Posts to stock"}
          tone={selectedOrder?.is_historical ? "neutral" : "warning"}
        />
      ),
    }),
    columnHelper.display({
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
      title="Sales Order Items"
      description="Kelola item order secara inline untuk menjaga nilai dan efek stok tetap konsisten."
    >
      <datalist id="sales-item-product-skus">
        {(productsQuery.data ?? []).map((product) => (
          <option key={product.sku} value={product.sku}>
            {product.product_name}
          </option>
        ))}
      </datalist>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total items" value={String(totalItems)} subtitle="Jumlah baris item untuk order terpilih." />
          <MetricCard
            title="Total gross"
            value={totalGross.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle="Σ qty × unit price."
          />
          <MetricCard
            title="Total discount"
            value={totalDiscount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle="Σ discount item."
          />
          <MetricCard
            title="Total net"
            value={totalNet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle={selectedOrder?.is_historical ? "Order historis: tidak mem-posting stok." : "Order normal: mem-posting stok."}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <label htmlFor="sales-order-selection" className="text-xs font-medium tracking-[0.02em] text-foreground/80">
              Selected order
            </label>
            <select
              id="sales-order-selection"
              className="min-w-[320px] rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-slate-900/5"
              value={selectedOrderNo ?? currentOrderNo ?? ""}
              disabled={ordersQuery.isLoading}
              onChange={(event) => setSelectedOrderNo(event.target.value || null)}
            >
              {(ordersQuery.data ?? []).map((order) => (
                <option key={order.order_no} value={order.order_no}>
                  {order.order_no} - {order.status}
                </option>
              ))}
            </select>

          </div>
          {currentOrderNo ? (
            <Button
              size="sm"
              disabled={actionPending}
              onClick={() => {
                startNewItem();
                if (!itemDraft && currentOrderNo) {
                  setItemDraft(createEmptySalesItemDraft(currentOrderNo));
                }
              }}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          ) : null}
        </div>

        {ordersQuery.isError ? (
          <EmptyState title="Failed to load sales orders" description={ordersQuery.error.message} />
        ) : productsQuery.isError ? (
          <EmptyState title="Failed to load products" description={productsQuery.error.message} />
        ) : itemsQuery.isError ? (
          <EmptyState title="Failed to load sales items" description={itemsQuery.error.message} />
        ) : currentOrderNo ? (
          <DataTable columns={columns} data={itemRows} emptyMessage="No sales order items found." />
        ) : (
          <EmptyState title="Select a sales order" description="Choose an order to maintain its inline order items." />
        )}
      </div>
    </PageShell>
  );
}
