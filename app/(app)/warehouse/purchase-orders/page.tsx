"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import {
  WAREHOUSE_PO_STATUS_OPTIONS,
  toDateInput,
  useWarehousePurchaseOrders,
  useWarehouseVendors,
} from "@/features/warehouse/use-warehouse-module";
import type { PurchaseOrderInput } from "@/schemas/warehouse-module";
import type { PurchaseOrderRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<PurchaseOrderRecord>();

export default function WarehousePurchaseOrdersPage() {
  const hooks = useWarehousePurchaseOrders();
  const { vendorsQuery } = useWarehouseVendors();
  const { purchaseOrdersQuery, purchaseOrderForm, purchaseOrderModal, editingPurchaseOrder } = hooks;
  const poRows = purchaseOrdersQuery.data ?? [];
  const totalPo = poRows.length;
  const openPo = poRows.filter((row) => row.status === "OPEN").length;
  const linkedInbound = poRows.reduce((sum, row) => sum + (row._count?.inbound_deliveries ?? 0), 0);
  const vendorsVisible = new Set(poRows.map((row) => row.vendor_code)).size;

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
      cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "OPEN" ? "info" : "neutral"} />,
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

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Purchase Orders"
      description="Kelola PO untuk kontrol pembelian dan pelacakan inbound."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total PO" value={String(totalPo)} subtitle="Jumlah PO yang terlihat." />
          <MetricCard title="PO OPEN" value={String(openPo)} subtitle="PO yang masih terbuka." />
          <MetricCard title="Linked inbound" value={String(linkedInbound)} subtitle="Total inbound yang terkait (visible)." />
          <MetricCard title="Vendors (visible)" value={String(vendorsVisible)} subtitle="Jumlah vendor unik di PO yang terlihat." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openPurchaseOrderModal()}>
            <Plus className="size-4" />
            Add purchase order
          </Button>
        </div>
        <DataTable columns={columns} data={purchaseOrdersQuery.data ?? []} emptyMessage="No purchase orders yet." />
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Order date"
            htmlFor="order_date"
            error={purchaseOrderForm.formState.errors.order_date?.message}
          >
            <Input id="order_date" type="date" {...purchaseOrderForm.register("order_date")} />
          </FormField>
          <FormField label="Status" htmlFor="status" error={purchaseOrderForm.formState.errors.status?.message}>
            <SelectNative id="status" {...purchaseOrderForm.register("status")}>
              {WAREHOUSE_PO_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
