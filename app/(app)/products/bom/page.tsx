"\"use client\";"

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { Plus, Pencil, Save, Trash2, X } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { useProductBom, useProductMaster } from "@/features/product/use-product-module";
import type { ProductBomRecord } from "@/types/product";

const columnHelper = createColumnHelper<ProductBomRecord>();

function emptyBom(selectedSku: string) {
  return {
    sku: selectedSku,
    component_group: "MAIN",
    component_type: "INVENTORY",
    inv_code: null,
    component_name: "",
    qty: "1",
    unit_cost: "0",
    is_stock_tracked: true,
    notes: "",
    sequence_no: 1,
    is_active: true,
  } as ProductBomRecord & { qty: string; unit_cost: string };
}

export default function ProductBomPage() {
  const { productsQuery } = useProductMaster();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const currentSku = selectedSku ?? productsQuery.data?.[0]?.sku ?? null;
  const {
    bomQuery,
    editingBomId,
    setEditingBomId,
    bomDraft,
    setBomDraft,
    saveBom,
    deleteBom,
  } = useProductBom(currentSku);

  const rows = useMemo(() => {
    const base = bomQuery.data ?? [];
    if (bomDraft && editingBomId === null) {
      return [
        {
          ...bomDraft,
          id: "__new__",
        },
        ...base,
      ];
    }
    return base;
  }, [bomQuery.data, bomDraft, editingBomId]);

  const isEditing = (id: string) => editingBomId === id || (id === "__new__" && bomDraft && editingBomId === null);

  const columns = [
    columnHelper.accessor("component_group", {
      header: "Group",
      cell: ({ row, getValue }) =>
        isEditing(row.original.id) ? (
          <Input
            value={bomDraft?.component_group ?? getValue()}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, component_group: e.target.value } : prev))}
            className="h-8 min-w-[120px]"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("component_type", { header: "Type" }),
    columnHelper.accessor("inv_code", { header: "Inventory ref" }),
    columnHelper.accessor("component_name", { header: "Component" }),
    columnHelper.accessor("qty", { header: "Qty" }),
    columnHelper.accessor("unit_cost", { header: "Unit cost" }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        isEditing(row.original.id) ? (
          <div className="flex gap-2 justify-end">
            <Button size="icon-xs" variant="outline" onClick={() => bomDraft && saveBom(bomDraft)}>
              <Save className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                setEditingBomId(null);
                setBomDraft(null);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                setEditingBomId(row.original.id as string);
                setBomDraft(row.original as ProductBomRecord & { qty: string; unit_cost: string });
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => selectedSku && deleteBom(selectedSku, row.original.id as string)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
    }),
  ];

  return (
    <PageShell eyebrow="Product" title="Product BOM" description="Inline BOM editing per product.">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="product-selection" className="text-sm font-medium text-slate-600">
              Select product:
            </label>
            <select
              id="product-selection"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              value={selectedSku ?? ""}
              onChange={(event) => setSelectedSku(event.target.value || null)}
            >
              {(productsQuery.data ?? []).map((product) => (
                <option key={product.sku} value={product.sku}>
                  {product.sku} — {product.product_name}
                </option>
              ))}
            </select>
          </div>
          {selectedSku && (
            <Button size="sm" onClick={() => setBomDraft(emptyBom(selectedSku))}>
              <Plus className="size-4" />
              Add BOM row
            </Button>
          )}
        </div>
        {selectedSku ? (
          <DataTable columns={columns} data={rows} emptyMessage="No BOM rows yet." />
        ) : (
          <EmptyState title="Select a product" description="Choose a product to manage its BOM rows." />
        )}
      </div>
    </PageShell>
  );
}
