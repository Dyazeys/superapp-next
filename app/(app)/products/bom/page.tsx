"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PRODUCT_BOOLEAN_OPTIONS,
  createEmptyBomDraft,
  parseBooleanInput,
  useProductBom,
  useProductInventory,
  useProductMaster,
  useProductSelection,
} from "@/features/product/use-product-module";
import type { ProductBomInput } from "@/schemas/product-module";
import type { ProductBomRecord } from "@/types/product";

const columnHelper = createColumnHelper<ProductBomRecord>();

function toBomDraft(row: ProductBomRecord): ProductBomInput {
  return {
    sku: row.sku,
    component_group: row.component_group,
    component_type: row.component_type,
    inv_code: row.inv_code,
    component_name: row.component_name,
    qty: row.qty,
    unit_cost: row.unit_cost,
    is_stock_tracked: row.is_stock_tracked,
    notes: row.notes ?? "",
    sequence_no: row.sequence_no,
    is_active: row.is_active,
  };
}

export default function ProductBomPage() {
  const { productsQuery } = useProductMaster();
  const { inventoryQuery } = useProductInventory();
  const { selectedSku, currentSku, setSelectedSku } = useProductSelection(productsQuery.data);
  const { bomQuery, editingBomId, setEditingBomId, bomDraft, setBomDraft, saveBom, deleteBom } = useProductBom(
    currentSku ?? undefined
  );

  const rows = useMemo(() => {
    const base = bomQuery.data ?? [];
    if (!bomDraft || editingBomId) {
      return base;
    }

    return [
      {
        id: "__new__",
        sku: bomDraft.sku,
        component_group: bomDraft.component_group,
        component_type: bomDraft.component_type,
        inv_code: bomDraft.inv_code ?? null,
        component_name: bomDraft.component_name,
        qty: bomDraft.qty,
        unit_cost: bomDraft.unit_cost,
        line_cost: (Number(bomDraft.qty) * Number(bomDraft.unit_cost)).toFixed(2),
        is_stock_tracked: bomDraft.is_stock_tracked,
        notes: bomDraft.notes ?? null,
        sequence_no: bomDraft.sequence_no,
        is_active: bomDraft.is_active,
        created_at: new Date().toISOString(),
        updated_at: null,
      },
      ...base,
    ];
  }, [bomQuery.data, bomDraft, editingBomId]);

  const isEditingRow = (id: string) => editingBomId === id || (id === "__new__" && !editingBomId && Boolean(bomDraft));

  const columns = [
    columnHelper.accessor("sequence_no", {
      header: "#",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={String(bomDraft?.sequence_no ?? getValue())}
            onChange={(e) =>
              setBomDraft((prev) => (prev ? { ...prev, sequence_no: Number(e.target.value || 1) } : prev))
            }
            className="h-8 w-16"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("component_group", {
      header: "Group",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={bomDraft?.component_group ?? getValue()}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, component_group: e.target.value } : prev))}
            className="h-8 min-w-[120px]"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("component_type", {
      header: "Type",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            list="bom-component-types"
            value={bomDraft?.component_type ?? getValue()}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, component_type: e.target.value } : prev))}
            className="h-8 min-w-[130px]"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("inv_code", {
      header: "Inventory Ref",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            list="bom-inventory-codes"
            value={bomDraft?.inv_code ?? getValue() ?? ""}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, inv_code: e.target.value || null } : prev))}
            className="h-8 min-w-[150px]"
          />
        ) : (
          getValue() ?? "-"
        ),
    }),
    columnHelper.accessor("component_name", {
      header: "Component",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={bomDraft?.component_name ?? getValue()}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, component_name: e.target.value } : prev))}
            className="h-8 min-w-[180px]"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("qty", {
      header: "Qty",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={bomDraft?.qty ?? getValue()}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, qty: e.target.value } : prev))}
            className="h-8 w-20"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("unit_cost", {
      header: "Unit Cost",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={bomDraft?.unit_cost ?? getValue()}
            onChange={(e) => setBomDraft((prev) => (prev ? { ...prev, unit_cost: e.target.value } : prev))}
            className="h-8 w-24"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.display({
      id: "line_cost",
      header: "Line Cost",
      cell: ({ row }) =>
        isEditingRow(row.original.id)
          ? (Number(bomDraft?.qty ?? row.original.qty) * Number(bomDraft?.unit_cost ?? row.original.unit_cost)).toFixed(2)
          : row.original.line_cost,
    }),
    columnHelper.accessor("is_stock_tracked", {
      header: "Tracked",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            list="bom-boolean-options"
            value={String(bomDraft?.is_stock_tracked ?? getValue())}
            onChange={(e) =>
              setBomDraft((prev) => (prev ? { ...prev, is_stock_tracked: parseBooleanInput(e.target.value) } : prev))
            }
            className="h-8 w-24"
          />
        ) : (
          <StatusBadge label={getValue() ? "Tracked" : "Manual"} tone={getValue() ? "info" : "neutral"} />
        ),
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            list="bom-boolean-options"
            value={String(bomDraft?.is_active ?? getValue())}
            onChange={(e) =>
              setBomDraft((prev) => (prev ? { ...prev, is_active: parseBooleanInput(e.target.value) } : prev))
            }
            className="h-8 w-24"
          />
        ) : (
          <StatusBadge label={getValue() ? "Active" : "Inactive"} tone={getValue() ? "success" : "neutral"} />
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        isEditingRow(row.original.id) ? (
          <div className="flex justify-end gap-2">
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
          <div className="flex justify-end gap-2">
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                setEditingBomId(row.original.id);
                setBomDraft(toBomDraft(row.original));
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteBom(row.original.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
    }),
  ];

  const selectedProduct = (productsQuery.data ?? []).find((product) => product.sku === currentSku);

  return (
    <PageShell
      eyebrow="Product"
      title="Product BOM"
      description="Manage BOM rows inline for each master product while keeping the Product workspace overview intact."
    >
      <datalist id="bom-component-types">
        <option value="INVENTORY" />
        <option value="NON_INVENTORY" />
      </datalist>
      <datalist id="bom-inventory-codes">
        {(inventoryQuery.data ?? []).map((item) => (
          <option key={item.inv_code} value={item.inv_code}>
            {item.inv_name}
          </option>
        ))}
      </datalist>
      <datalist id="bom-boolean-options">
        {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <label htmlFor="product-selection" className="text-sm font-medium text-muted-foreground">
              Selected product
            </label>
            <select
              id="product-selection"
              className="min-w-[280px] rounded-2xl border border-input bg-background px-3 py-2 text-sm"
              value={selectedSku ?? currentSku ?? ""}
              onChange={(event) => setSelectedSku(event.target.value || null)}
            >
              {(productsQuery.data ?? []).map((product) => (
                <option key={product.sku} value={product.sku}>
                  {product.sku} - {product.product_name}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {selectedProduct
                ? `${selectedProduct.product_name} · ${selectedProduct._count?.product_bom ?? 0} BOM rows`
                : "Choose a product to manage its BOM rows."}
            </p>
          </div>
          {currentSku ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingBomId(null);
                setBomDraft(createEmptyBomDraft(currentSku));
              }}
            >
              <Plus className="size-4" />
              Add BOM row
            </Button>
          ) : null}
        </div>
        {currentSku ? (
          <DataTable columns={columns} data={rows} emptyMessage="No BOM rows yet." />
        ) : (
          <EmptyState title="Select a product" description="Choose a product to manage its BOM rows." />
        )}
      </div>
    </PageShell>
  );
}

