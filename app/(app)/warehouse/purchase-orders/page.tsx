"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryPicker } from "@/components/patterns/inventory-picker";
import { SelectNative } from "@/components/ui/select-native";
import { cn } from "@/lib/utils";
import { warehouseApi } from "@/features/warehouse/api";
import {
  toDateInput,
  useWarehousePurchaseOrders,
  useWarehouseVendors,
} from "@/features/warehouse/use-warehouse-module";
import { purchaseOrderItemSchema, type PurchaseOrderInput, type PurchaseOrderItemInput } from "@/schemas/warehouse-module";
import type { PurchaseOrderItemRecord, PurchaseOrderRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<PurchaseOrderRecord>();
const itemColumnHelper = createColumnHelper<PurchaseOrderItemRecord>();
type PurchaseOrderItemFormValues = z.input<typeof purchaseOrderItemSchema>;

export default function WarehousePurchaseOrdersPage() {
  const hooks = useWarehousePurchaseOrders();
  const { vendorsQuery } = useWarehouseVendors();
  const { purchaseOrdersQuery, purchaseOrderForm, purchaseOrderModal, editingPurchaseOrder } = hooks;
  const poRows = useMemo(() => purchaseOrdersQuery.data ?? [], [purchaseOrdersQuery.data]);
  const totalPo = poRows.length;
  const openPo = poRows.filter((row) => row.status === "OPEN").length;
  const partialPo = poRows.filter((row) => row.status === "PARTIAL").length;
  const closedPo = poRows.filter((row) => row.status === "CLOSED").length;
  const linkedInbound = poRows.reduce((sum, row) => sum + (row._count?.inbound_deliveries ?? 0), 0);

  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  const [bulkDeletingPo, setBulkDeletingPo] = useState(false);
  const selectedPoCount = selectedPoIds.length;
  const modalPoId = editingPurchaseOrder?.id ?? null;

  useEffect(() => {
    const existingIds = new Set(poRows.map((row) => row.id));
    setSelectedPoIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [poRows]);

  const togglePoSelection = (id: string) => {
    setSelectedPoIds((prev) => (prev.includes(id) ? prev.filter((current) => current !== id) : [...prev, id]));
  };

  const handleDeleteSelectedPo = async () => {
    if (selectedPoCount === 0 || bulkDeletingPo) {
      return;
    }

    const shouldDelete = window.confirm(`Hapus ${selectedPoCount} purchase order terpilih?`);
    if (!shouldDelete) {
      return;
    }

    try {
      setBulkDeletingPo(true);
      await hooks.bulkDeletePurchaseOrders(selectedPoIds);
      setSelectedPoIds([]);
    } catch {
      // toast sudah di-handle di hook
    } finally {
      setBulkDeletingPo(false);
    }
  };

  const poItemsQuery = useQuery({
    queryKey: ["warehouse-po-items", modalPoId],
    queryFn: () => warehouseApi.purchaseOrders.items.list(modalPoId!),
    enabled: Boolean(modalPoId && purchaseOrderModal.open),
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseOrderItemRecord | null>(null);
  const itemForm = useForm<PurchaseOrderItemFormValues, unknown, PurchaseOrderItemInput>({
    resolver: zodResolver(purchaseOrderItemSchema),
    defaultValues: {
      po_id: "",
      inv_code: "",
      qty_ordered: 1,
      unit_cost: null,
    },
  });

  const queryClient = useQueryClient();

  const savePoItemMutation = useMutation({
    mutationFn: async (values: PurchaseOrderItemInput) => {
      if (!modalPoId) {
        throw new Error("Select a PO first.");
      }

      const payload = {
        inv_code: values.inv_code,
        qty_ordered: values.qty_ordered,
        unit_cost: values.unit_cost,
      };

      return editingItem
        ? warehouseApi.purchaseOrders.items.update(modalPoId, editingItem.id, payload)
        : warehouseApi.purchaseOrders.items.create(modalPoId, payload);
    },
    onSuccess: async () => {
      toast.success(`PO item ${editingItem ? "updated" : "created"}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["warehouse-po-items", modalPoId] }),
        queryClient.invalidateQueries({ queryKey: ["warehouse-purchase-orders"] }),
      ]);
      setEditingItem(null);
      setItemModalOpen(false);
      itemForm.reset({ po_id: modalPoId ?? "", inv_code: "", qty_ordered: 1, unit_cost: null });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save PO item");
    },
  });

  const deletePoItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!modalPoId) {
        throw new Error("Select a PO first.");
      }
      return warehouseApi.purchaseOrders.items.remove(modalPoId, itemId);
    },
    onSuccess: async () => {
      toast.success("PO item deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["warehouse-po-items", modalPoId] }),
        queryClient.invalidateQueries({ queryKey: ["warehouse-purchase-orders"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete PO item");
    },
  });

  const openNewPoItemModal = () => {
    if (!modalPoId) {
      toast.error("Select a PO first.");
      return;
    }
    setEditingItem(null);
    itemForm.reset({ po_id: modalPoId, inv_code: "", qty_ordered: 1, unit_cost: null });
    setItemModalOpen(true);
  };

  const openEditPoItemModal = (item: PurchaseOrderItemRecord) => {
    if (!modalPoId) {
      toast.error("Select a PO first.");
      return;
    }
    setEditingItem(item);
    itemForm.reset({
      po_id: modalPoId,
      inv_code: item.inv_code,
      qty_ordered: item.qty_ordered,
      unit_cost: item.unit_cost,
    });
    setItemModalOpen(true);
  };

  const columns = [
    columnHelper.accessor("po_number", {
      header: "PO Number",
      cell: ({ row, getValue }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={`Select purchase order ${getValue()}`}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
              selectedPoIds.includes(row.original.id)
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-slate-300 bg-white text-transparent hover:border-slate-400"
            )}
            onClick={() => togglePoSelection(row.original.id)}
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            className="text-left font-medium text-blue-600 hover:underline"
            onClick={() => {
              hooks.openPurchaseOrderModal(row.original);
            }}
          >
            {getValue()}
          </button>
        </div>
      ),
    }),
    columnHelper.accessor("vendor_code", {
      header: "Vendor",
      cell: (info) => info.row.original.master_vendor?.vendor_name ?? info.getValue(),
    }),
    columnHelper.accessor("order_date", {
      header: "Order Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <StatusBadge
          label={info.getValue()}
          tone={info.getValue() === "OPEN" ? "info" : info.getValue() === "PARTIAL" ? "warning" : "success"}
        />
      ),
    }),
    columnHelper.display({
      id: "inbound_count",
      header: "Inbound",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.inbound_deliveries ?? 0} linked`} tone="info" />,
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          {selectedPoCount > 0 ? (
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {selectedPoCount} selected
            </span>
          ) : null}
          <Button
            size="icon-xs"
            variant="outline"
            className="h-8 w-8 border-rose-300 text-rose-600 hover:bg-rose-50"
            disabled={selectedPoCount === 0 || bulkDeletingPo}
            onClick={handleDeleteSelectedPo}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openPurchaseOrderModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const itemColumns = [
    itemColumnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p>
        </div>
      ),
    }),
    itemColumnHelper.accessor("qty_ordered", { header: "Qty Ordered" }),
    itemColumnHelper.accessor("unit_cost", {
      header: "Unit Cost",
      cell: (info) => info.getValue() ?? "-",
    }),
    itemColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => openEditPoItemModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => deletePoItemMutation.mutate(row.original.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Purchase Orders"
      description="Kelola PO untuk kontrol pembelian dan pelacakan inbound."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total PO" value={String(totalPo)} subtitle="Jumlah PO yang terlihat." />
          <MetricCard title="PO OPEN" value={String(openPo)} subtitle="Belum ada receiving posted." />
          <MetricCard title="PO PARTIAL" value={String(partialPo)} subtitle="Receiving posted belum memenuhi qty order." />
          <MetricCard title="PO CLOSED" value={String(closedPo)} subtitle="Qty order sudah terpenuhi." />
          <MetricCard title="Linked inbound" value={String(linkedInbound)} subtitle="Total inbound terkait (visible)." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openPurchaseOrderModal()}>
            <Plus className="size-4" />
            Add purchase order
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={poRows}
          emptyMessage="No purchase orders yet."
          stickyHeader
          maxBodyHeight={560}
          pagination={{ enabled: true, pageSize: 8, pageSizeOptions: [8, 12, 20, 50] }}
        />
      </div>

      <ModalFormShell
        open={purchaseOrderModal.open}
        onOpenChange={purchaseOrderModal.setOpen}
        title={editingPurchaseOrder ? "Edit purchase order" : "Create purchase order"}
        description="Kelola header PO dan item PO dalam satu popup seperti alur inbound."
        isSubmitting={purchaseOrderForm.formState.isSubmitting}
        onSubmit={() => {
          return purchaseOrderForm.handleSubmit((values: PurchaseOrderInput) =>
            hooks.savePurchaseOrder(values, { closeOnSuccess: false })
          )();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="PO number"
            htmlFor="po_number"
            error={purchaseOrderForm.formState.errors.po_number?.message}
          >
            <Input id="po_number" {...purchaseOrderForm.register("po_number")} />
          </FormField>
          <FormField
            label="Vendor code"
            htmlFor="vendor_code"
            error={purchaseOrderForm.formState.errors.vendor_code?.message}
            helperText={
              (vendorsQuery.data?.length ?? 0) === 0
                ? "Belum ada vendor. Isi dulu di menu Warehouse > Vendors."
                : undefined
            }
          >
            <SelectNative id="vendor_code" {...purchaseOrderForm.register("vendor_code")}>
              <option value="">Select vendor</option>
              {(vendorsQuery.data ?? []).map((vendor) => (
                <option key={vendor.vendor_code} value={vendor.vendor_code}>
                  {vendor.vendor_name}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <FormField
          label="Order date"
          htmlFor="order_date"
          error={purchaseOrderForm.formState.errors.order_date?.message}
        >
          <Input id="order_date" type="date" {...purchaseOrderForm.register("order_date")} />
        </FormField>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">PO Items</p>
              <p className="text-sm text-muted-foreground">
                {modalPoId && editingPurchaseOrder
                  ? `Kelola item untuk ${editingPurchaseOrder.po_number}.`
                  : "Simpan PO dulu, lalu item bisa ditambahkan di popup yang sama."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editingPurchaseOrder ? (
                <StatusBadge
                  label={editingPurchaseOrder.status}
                  tone={
                    editingPurchaseOrder.status === "OPEN"
                      ? "info"
                      : editingPurchaseOrder.status === "PARTIAL"
                        ? "warning"
                        : "success"
                  }
                />
              ) : null}
              <Button size="sm" onClick={openNewPoItemModal} disabled={!modalPoId}>
                <Plus className="size-4" />
                Add PO item
              </Button>
            </div>
          </div>

          {modalPoId ? (
            <DataTable
              columns={itemColumns}
              data={poItemsQuery.data ?? []}
              emptyMessage="No PO items yet."
              stickyHeader
              maxBodyHeight={300}
              pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 20] }}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-muted-foreground">
              Simpan purchase order terlebih dahulu untuk mengaktifkan item.
            </p>
          )}
        </div>
      </ModalFormShell>

      <ModalFormShell
        open={itemModalOpen}
        onOpenChange={(open) => {
          setItemModalOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
        title={editingItem ? "Edit PO item" : "Create PO item"}
        description="Set ordered quantities per inventory to drive automatic PO OPEN/PARTIAL/CLOSED status."
        isSubmitting={savePoItemMutation.isPending}
        onSubmit={() => {
          return itemForm.handleSubmit((values: PurchaseOrderItemInput) => savePoItemMutation.mutate(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Inventory code"
            htmlFor="po_item_inv_code"
            error={itemForm.formState.errors.inv_code?.message}
          >
            <InventoryPicker
              id="po_item_inv_code"
              value={itemForm.watch("inv_code") ?? ""}
              placeholder="Select inventory"
              onValueChange={(next) => itemForm.setValue("inv_code", next, { shouldValidate: true })}
            />
          </FormField>
          <FormField
            label="Qty ordered"
            htmlFor="po_item_qty_ordered"
            error={itemForm.formState.errors.qty_ordered?.message}
          >
            <Input id="po_item_qty_ordered" type="number" {...itemForm.register("qty_ordered", { valueAsNumber: true })} />
          </FormField>
        </div>
        <FormField label="Unit cost" htmlFor="po_item_unit_cost" error={itemForm.formState.errors.unit_cost?.message as string | undefined}>
          <Input id="po_item_unit_cost" {...itemForm.register("unit_cost")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
