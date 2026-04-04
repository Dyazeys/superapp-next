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
  PRODUCT_BOOLEAN_OPTIONS,
  parseBooleanInput,
  useProductInventory,
} from "@/features/product/use-product-module";
import type { MasterInventoryInput } from "@/schemas/product-module";
import type { MasterInventoryRecord } from "@/types/product";

const columnHelper = createColumnHelper<MasterInventoryRecord>();

export default function ProductInventoryPage() {
  const hooks = useProductInventory();
  const { inventoryQuery, inventoryForm, inventoryModal, editingInventory } = hooks;

  const columns = [
    columnHelper.accessor("inv_code", {
      header: "Code",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("inv_name", { header: "Inventory" }),
    columnHelper.accessor("hpp", { header: "HPP" }),
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
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openInventoryModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteInventory(row.original.inv_code)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Product"
      title="Master Inventory"
      description="Manage inventory references reused by products and BOM components."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openInventoryModal()}>
            <Plus className="size-4" />
            Add inventory
          </Button>
        </div>
        <DataTable columns={columns} data={inventoryQuery.data ?? []} emptyMessage="No inventory references yet." />
      </div>

      <ModalFormShell
        open={inventoryModal.open}
        onOpenChange={inventoryModal.setOpen}
        title={editingInventory ? "Edit inventory" : "Create inventory"}
        description="Manage inventory references used across products and BOM rows."
        isSubmitting={inventoryForm.formState.isSubmitting}
        onSubmit={() => {
          return inventoryForm.handleSubmit((values: MasterInventoryInput) => hooks.saveInventory(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Inventory code" htmlFor="inv_code" error={inventoryForm.formState.errors.inv_code?.message}>
            <Input id="inv_code" {...inventoryForm.register("inv_code")} disabled={Boolean(editingInventory)} />
          </FormField>
          <FormField label="Inventory name" htmlFor="inv_name" error={inventoryForm.formState.errors.inv_name?.message}>
            <Input id="inv_name" {...inventoryForm.register("inv_name")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="HPP" htmlFor="hpp" error={inventoryForm.formState.errors.hpp?.message}>
            <Input id="hpp" {...inventoryForm.register("hpp")} />
          </FormField>
          <FormField label="Active" htmlFor="inventory_active">
            <Input
              id="inventory_active"
              list="inventory-boolean-options"
              value={String(inventoryForm.watch("is_active"))}
              onChange={(e) => inventoryForm.setValue("is_active", parseBooleanInput(e.target.value))}
            />
          </FormField>
        </div>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" {...inventoryForm.register("description")} />
        </FormField>
        <datalist id="inventory-boolean-options">
          {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>
      </ModalFormShell>
    </PageShell>
  );
}
