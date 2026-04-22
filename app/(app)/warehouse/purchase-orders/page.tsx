"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { SelectNative } from "@/components/ui/select-native";
import { warehouseApi } from "@/features/warehouse/api";
import {
  toDateInput,
  useWarehouseInventoryLookup,
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
  const inventoryQuery = useWarehouseInventoryLookup();
  const { purchaseOrdersQuery, purchaseOrderForm, purchaseOrderModal, editingPurchaseOrder } = hooks;
  const poRows = useMemo(() => purchaseOrdersQuery.data ?? [], [purchaseOrdersQuery.data]);
  const totalPo = poRows.length;
  const openPo = poRows.filter((row) => row.status === "OPEN").length;
  const partialPo = poRows.filter((row) => row.status === "PARTIAL").length;
  const closedPo = poRows.filter((row) => row.status === "CLOSED").length;
  const linkedInbound = poRows.reduce((sum, row) => sum + (row._count?.inbound_deliveries ?? 0), 0);

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const currentPoId = useMemo(() => selectedPoId ?? poRows[0]?.id ?? null, [selectedPoId, poRows]);
  const selectedPo = useMemo(() => poRows.find((po) => po.id === currentPoId) ?? null, [poRows, currentPoId]);

  const poItemsQuery = useQuery({
    queryKey: ["warehouse-po-items", currentPoId],
    queryFn: () => warehouseApi.purchaseOrders.items.list(currentPoId!),
    enabled: Boolean(currentPoId),
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseOrderItemRecord | null>(null);
  const itemForm = useForm<PurchaseOrderItemFormValues, unknown, PurchaseOrderItemInput>({
    resolver: zodResolver(purchaseOrderItemSchema),
    defaultValues: {
      po_id: currentPoId ?? "",
      inv_code: "",
      qty_ordered: 1,
      unit_cost: null,
    },
  });

  const queryClient = useQueryClient();

  const savePoItemMutation = useMutation({
    mutationFn: async (values: PurchaseOrderItemInput) => {
      if (!currentPoId) {
        throw new Error("Select a PO first.");
      }

      const payload = {
        inv_code: values.inv_code,
        qty_ordered: values.qty_ordered,
        unit_cost: values.unit_cost,
      };

      return editingItem
        ? warehouseApi.purchaseOrders.items.update(currentPoId, editingItem.id, payload)
        : warehouseApi.purchaseOrders.items.create(currentPoId, payload);
    },
    onSuccess: async () => {
      toast.success(`PO item ${editingItem ? "updated" : "created"}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["warehouse-po-items", currentPoId] }),
        queryClient.invalidateQueries({ queryKey: ["warehouse-purchase-orders"] }),
      ]);
      setEditingItem(null);
      setItemModalOpen(false);
      itemForm.reset({ po_id: currentPoId ?? "", inv_code: "", qty_ordered: 1, unit_cost: null });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save PO item");
    },
  });

  const deletePoItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!currentPoId) {
        throw new Error("Select a PO first.");
      }
      return warehouseApi.purchaseOrders.items.remove(currentPoId, itemId);
    },
    onSuccess: async () => {
      toast.success("PO item deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["warehouse-po-items", currentPoId] }),
        queryClient.invalidateQueries({ queryKey: ["warehouse-purchase-orders"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete PO item");
    },
  });

  const openNewPoItemModal = () => {
    if (!currentPoId) {
      toast.error("Select a PO first.");
      return;
    }
    setEditingItem(null);
    itemForm.reset({ po_id: currentPoId, inv_code: "", qty_ordered: 1, unit_cost: null });
    setItemModalOpen(true);
  };

  const openEditPoItemModal = (item: PurchaseOrderItemRecord) => {
    if (!currentPoId) {
      toast.error("Select a PO first.");
      return;
    }
    setEditingItem(item);
    itemForm.reset({
      po_id: currentPoId,
      inv_code: item.inv_code,
      qty_ordered: item.qty_ordered,
      unit_cost: item.unit_cost,
    });
    setItemModalOpen(true);
  };

  const columns = [
    columnHelper.accessor("po_number", {
      header: "PO Number",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
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
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openPurchaseOrderModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deletePurchaseOrder(row.original.id)}>
            <Trash2 className="size-3.5" />
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
        <DataTable columns={columns} data={poRows} emptyMessage="No purchase orders yet." />

        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-[520px] space-y-1.5">
              <label htmlFor="warehouse-po-selection" className="text-xs font-medium tracking-[0.02em] text-foreground/80">
                Selected PO
              </label>
              <SelectNative
                id="warehouse-po-selection"
                className="w-full"
                value={selectedPoId ?? currentPoId ?? ""}
                disabled={purchaseOrdersQuery.isLoading}
                onChange={(event) => setSelectedPoId(event.target.value || null)}
              >
                {poRows.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} - {toDateInput(po.order_date)}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="flex items-center gap-2">
              {selectedPo ? (
                <StatusBadge
                  label={selectedPo.status}
                  tone={selectedPo.status === "OPEN" ? "info" : selectedPo.status === "PARTIAL" ? "warning" : "success"}
                />
              ) : null}
              <Button size="sm" onClick={openNewPoItemModal} disabled={!currentPoId}>
                <Plus className="size-4" />
                Add PO item
              </Button>
            </div>
          </div>
          <DataTable columns={itemColumns} data={poItemsQuery.data ?? []} emptyMessage="No PO items yet." />
        </div>
      </div>

      <ModalFormShell
        open={purchaseOrderModal.open}
        onOpenChange={purchaseOrderModal.setOpen}
        title={editingPurchaseOrder ? "Edit purchase order" : "Create purchase order"}
        description="Manage PO headers while reusing the existing warehouse endpoints."
        isSubmitting={purchaseOrderForm.formState.isSubmitting}
        onSubmit={() => {
          return purchaseOrderForm.handleSubmit((values: PurchaseOrderInput) => hooks.savePurchaseOrder(values))();
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
            <SelectNative id="po_item_inv_code" {...itemForm.register("inv_code")}>
              <option value="">Select inventory</option>
              {(inventoryQuery.data ?? []).map((inventory) => (
                <option key={inventory.inv_code} value={inventory.inv_code}>
                  {inventory.inv_code} - {inventory.inv_name}
                </option>
              ))}
            </SelectNative>
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
