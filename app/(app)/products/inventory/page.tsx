import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { FormField } from "@/components/forms/form-field";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { useProductInventory } from "@/features/product/use-product-module";
import type { MasterInventoryRecord } from "@/types/product";

const columnHelper = createColumnHelper<MasterInventoryRecord>();

const booleanOptions = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
];

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
        <div className="flex gap-2 justify-end">
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
    <PageShell eyebrow="Product" title="Master Inventory" description="Manage inventory references reused by products and BOMs.">
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
        description="Modal CRUD for inventory records."
        onSubmit={inventoryForm.handleSubmit((values) => hooks.saveInventory(values))}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Inventory code" htmlFor="inv_code" error={inventoryForm.formState.errors.inv_code?.message}>
            <Input id="inv_code" {...inventoryForm.register("inv_code")} disabled={Boolean(editingInventory)} />
          </FormField>
          <FormField label="Name" htmlFor="inv_name" error={inventoryForm.formState.errors.inv_name?.message}>
            <Input id="inv_name" {...inventoryForm.register("inv_name")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="HPP" htmlFor="hpp" error={inventoryForm.formState.errors.hpp?.message}>
            <Input id="hpp" {...inventoryForm.register("hpp")} />
          </FormField>
          <FormField label="Active" htmlFor="is_active">
            <Input
              id="is_active"
              list="boolean-options"
              value={String(inventoryForm.watch("is_active"))}
              onChange={(e) => inventoryForm.setValue("is_active", e.target.value === "true")}
            />
          </FormField>
        </div>
        <FormField label="Description" htmlFor="description">
          <Input id="description" {...inventoryForm.register("description")} />
        </FormField>
        <datalist id="boolean-options">
          {booleanOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>
      </ModalFormShell>
    </PageShell>
  );
}
