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
  const inventoryRows = inventoryQuery.data ?? [];
  const totalInventory = inventoryRows.length;
  const activeInventory = inventoryRows.filter((row) => row.is_active).length;
  const totalUnitCost = inventoryRows.reduce((sum, row) => sum + Number(row.unit_cost || 0), 0);
  const activeUnitCost = inventoryRows.reduce((sum, row) => sum + (row.is_active ? Number(row.unit_cost || 0) : 0), 0);

  const columns = [
    columnHelper.accessor("inv_code", {
      header: "Code",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("inv_name", { header: "Inventory" }),
    columnHelper.accessor("unit_cost", { header: "Unit Cost" }),
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
          <Button size="icon-xs" variant="outline" onClick={() => { if (window.confirm("Hapus inventory ini?")) hooks.deleteInventory(row.original.inv_code); }}>
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
      description="Kelola master inventory yang dipakai lintas produk dan komponen BOM."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total inventory" value={String(totalInventory)} subtitle="Semua item yang terlihat di halaman ini." />
          <MetricCard title="Inventory aktif" value={String(activeInventory)} subtitle="Item berstatus aktif." />
          <MetricCard
            title="Total Unit Cost (visible)"
            value={totalUnitCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle="Akumulasi unit cost dari semua item yang terlihat."
          />
          <MetricCard
            title="Unit Cost aktif"
            value={activeUnitCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle="Akumulasi unit cost untuk item aktif."
          />
        </div>

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
          <FormField label="Unit Cost" htmlFor="unit_cost" error={inventoryForm.formState.errors.unit_cost?.message}>
            <Input id="unit_cost" {...inventoryForm.register("unit_cost")} />
          </FormField>
          <FormField label="Active" htmlFor="inventory_active">
            <SelectNative
              id="inventory_active"
              value={String(inventoryForm.watch("is_active"))}
              onChange={(e) => inventoryForm.setValue("is_active", parseBooleanInput(e.target.value))}
            >
              {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" {...inventoryForm.register("description")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
