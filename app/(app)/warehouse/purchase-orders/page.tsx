"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      description="Manage purchase order headers with vendor references and inbound tracking."
    >
      <datalist id="warehouse-po-vendor-codes">
        {(vendorsQuery.data ?? []).map((vendor) => (
          <option key={vendor.vendor_code} value={vendor.vendor_code}>
            {vendor.vendor_name}
          </option>
        ))}
      </datalist>
      <datalist id="warehouse-po-statuses">
        {WAREHOUSE_PO_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status} />
        ))}
      </datalist>

      <div className="space-y-4">
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
          >
            <Input id="vendor_code" list="warehouse-po-vendor-codes" {...purchaseOrderForm.register("vendor_code")} />
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
            <Input id="status" list="warehouse-po-statuses" {...purchaseOrderForm.register("status")} />
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
