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
import { Textarea } from "@/components/ui/textarea";
import {
  WAREHOUSE_BOOLEAN_OPTIONS,
  parseWarehouseBooleanInput,
  useWarehouseVendors,
} from "@/features/warehouse/use-warehouse-module";
import type { VendorInput } from "@/schemas/warehouse-module";
import type { VendorRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<VendorRecord>();

export default function WarehouseVendorsPage() {
  const hooks = useWarehouseVendors();
  const { vendorsQuery, vendorForm, vendorModal, editingVendor } = hooks;

  const columns = [
    columnHelper.accessor("vendor_code", {
      header: "Code",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("vendor_name", { header: "Vendor" }),
    columnHelper.accessor("pic_name", {
      header: "PIC",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "purchase_orders",
      header: "POs",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.purchase_orders ?? 0} linked`} tone="info" />,
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openVendorModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteVendor(row.original.vendor_code)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Vendors"
      description="Manage master vendor records reused across purchase orders and inbound receiving."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openVendorModal()}>
            <Plus className="size-4" />
            Add vendor
          </Button>
        </div>
        <DataTable columns={columns} data={vendorsQuery.data ?? []} emptyMessage="No vendors yet." />
      </div>

      <ModalFormShell
        open={vendorModal.open}
        onOpenChange={vendorModal.setOpen}
        title={editingVendor ? "Edit vendor" : "Create vendor"}
        description="Manage vendor master records without changing warehouse business rules."
        isSubmitting={vendorForm.formState.isSubmitting}
        onSubmit={() => {
          return vendorForm.handleSubmit((values: VendorInput) => hooks.saveVendor(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Vendor code" htmlFor="vendor_code" error={vendorForm.formState.errors.vendor_code?.message}>
            <Input id="vendor_code" {...vendorForm.register("vendor_code")} disabled={Boolean(editingVendor)} />
          </FormField>
          <FormField label="Vendor name" htmlFor="vendor_name" error={vendorForm.formState.errors.vendor_name?.message}>
            <Input id="vendor_name" {...vendorForm.register("vendor_name")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="PIC" htmlFor="pic_name">
            <Input id="pic_name" {...vendorForm.register("pic_name")} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" {...vendorForm.register("phone")} />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="address">
          <Textarea id="address" {...vendorForm.register("address")} />
        </FormField>
        <FormField label="Active" htmlFor="vendor_active">
          <Input
            id="vendor_active"
            list="warehouse-vendor-boolean-options"
            value={String(vendorForm.watch("is_active"))}
            onChange={(event) => vendorForm.setValue("is_active", parseWarehouseBooleanInput(event.target.value))}
          />
        </FormField>
        <datalist id="warehouse-vendor-boolean-options">
          {WAREHOUSE_BOOLEAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>
      </ModalFormShell>
    </PageShell>
  );
}
