"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_BOM_GROUP_OPTIONS,
  PRODUCT_BOM_TYPE_OPTIONS,
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

function asBomGroup(value: string) {
  if (value === "OVERHEAD") return "BRANDING";
  if (value === "OTHER_COST") return "BRANDING";
  return PRODUCT_BOM_GROUP_OPTIONS.includes(value as (typeof PRODUCT_BOM_GROUP_OPTIONS)[number])
    ? (value as (typeof PRODUCT_BOM_GROUP_OPTIONS)[number])
    : "MAIN";
}

function toBomDraft(row: ProductBomRecord): ProductBomInput {
  const group = asBomGroup(row.component_group);
  const type = PRODUCT_BOM_TYPE_OPTIONS.includes(row.component_type as (typeof PRODUCT_BOM_TYPE_OPTIONS)[number])
    ? (row.component_type as (typeof PRODUCT_BOM_TYPE_OPTIONS)[number])
    : "INVENTORY";

  return {
    sku: row.sku,
    component_group: group,
    component_type: type,
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
  const { selectedSku, currentSku, setSelectedSku } = useProductSelection();
  const { bomQuery, editingBomId, setEditingBomId, bomDraft, setBomDraft, saveBom, deleteBom, actionPending } =
    useProductBom(currentSku ?? undefined);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<ProductBomInput | null>(null);

  const bomRows = bomQuery.data ?? [];
  const totalBomRows = bomRows.length;
  const activeBomRows = bomRows.filter((row) => row.is_active).length;
  const trackedBomRows = bomRows.filter((row) => row.is_stock_tracked).length;
  const totalBomValue = bomRows.reduce((sum, row) => sum + Number(row.qty) * Number(row.unit_cost), 0);
  const activeBomValue = bomRows.reduce(
    (sum, row) => sum + (row.is_active ? Number(row.qty) * Number(row.unit_cost) : 0),
    0
  );
  const selectedSkuValue = selectedSku ?? "";

  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((product) => ({
        value: product.sku,
        label: `${product.sku} - ${product.product_name}`,
      })),
    [productsQuery.data]
  );

  const inventoryOptions = useMemo(
    () =>
      (inventoryQuery.data ?? []).map((item) => ({
        value: item.inv_code,
        label: `${item.inv_code} - ${item.inv_name}`,
      })),
    [inventoryQuery.data]
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
          <SelectNative
            value={bomDraft?.component_group ?? getValue()}
            onChange={(event) =>
              setBomDraft((prev) =>
                prev
                  ? {
                      ...prev,
                      component_group: asBomGroup(event.target.value),
                    }
                  : prev
              )
            }
            className="h-8 min-w-[120px]"
          >
            {PRODUCT_BOM_GROUP_OPTIONS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </SelectNative>
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("component_type", {
      header: "Type",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <SelectNative
            value={bomDraft?.component_type ?? getValue()}
            onChange={(event) =>
              setBomDraft((prev) =>
                prev
                  ? {
                      ...prev,
                      component_type: event.target.value as (typeof PRODUCT_BOM_TYPE_OPTIONS)[number],
                    }
                  : prev
              )
            }
            className="h-8 min-w-[130px]"
          >
            {PRODUCT_BOM_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectNative>
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("inv_code", {
      header: "Inventory Ref",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <SearchableSelect
            value={bomDraft?.inv_code ?? getValue() ?? ""}
            options={inventoryOptions}
            placeholder="Search inventory..."
            inputClassName="h-8 min-w-[180px]"
            onValueChange={(next) => setBomDraft((prev) => (prev ? { ...prev, inv_code: next || null } : prev))}
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
          <SelectNative
            value={String(bomDraft?.is_stock_tracked ?? getValue())}
            onChange={(e) =>
              setBomDraft((prev) => (prev ? { ...prev, is_stock_tracked: parseBooleanInput(e.target.value) } : prev))
            }
            className="h-8 w-24"
          >
            {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectNative>
        ) : (
          <StatusBadge label={getValue() ? "Tracked" : "Manual"} tone={getValue() ? "info" : "neutral"} />
        ),
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <SelectNative
            value={String(bomDraft?.is_active ?? getValue())}
            onChange={(e) =>
              setBomDraft((prev) => (prev ? { ...prev, is_active: parseBooleanInput(e.target.value) } : prev))
            }
            className="h-8 w-24"
          >
            {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectNative>
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
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={() => bomDraft && saveBom(bomDraft)}>
              <Save className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              disabled={actionPending}
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
              disabled={actionPending}
              onClick={() => {
                setEditingBomId(row.original.id);
                setBomDraft(toBomDraft(row.original));
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={() => deleteBom(row.original.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Product"
      title="Product BOM"
      description="Kelola baris BOM per SKU secara inline untuk kebutuhan komponen dan estimasi nilai."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total BOM rows" value={String(totalBomRows)} subtitle="Baris BOM yang terlihat untuk SKU ini." />
          <MetricCard title="Active rows" value={String(activeBomRows)} subtitle="Baris aktif yang digunakan." />
          <MetricCard title="Stock-tracked" value={String(trackedBomRows)} subtitle="Baris yang memengaruhi stok." />
          <MetricCard
            title="Total BOM value"
            value={totalBomValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle="Σ qty × unit cost (semua baris)."
          />
          <MetricCard
            title="Active BOM value"
            value={activeBomValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle="Σ qty × unit cost (baris aktif)."
          />
        </div>

        <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-6">
            <label
              htmlFor="product-selection"
              className="w-[140px] shrink-0 text-xs font-medium tracking-[0.02em] text-foreground/80"
            >
              Search product
            </label>
            <div className="min-w-0">
              <SearchableSelect
                id="product-selection"
                className="min-w-[320px]"
                inputClassName="h-11 min-w-[320px] rounded-2xl bg-background px-3 py-2.5 text-sm shadow-sm shadow-slate-900/5"
                value={selectedSkuValue}
                options={productOptions}
                placeholder="cari produk di sini"
                disabled={productsQuery.isLoading}
                onValueChange={(next) => setSelectedSku(next || null)}
              />
            </div>
          </div>
          {currentSku ? (
            <Button
              size="sm"
              disabled={actionPending}
              onClick={() => {
                setEditingBomId(null);
                setBomDraft(null);
                setAddDraft(createEmptyBomDraft(currentSku));
                setAddModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add BOM row
            </Button>
          ) : null}
        </div>
        {productsQuery.isError ? (
          <EmptyState title="Failed to load products" description={productsQuery.error.message} />
        ) : inventoryQuery.isError ? (
          <EmptyState title="Failed to load inventory" description={inventoryQuery.error.message} />
        ) : (inventoryQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="Inventory Is Empty" description="Isi master inventory terlebih dulu sebelum setup BOM ter-track stok." />
        ) : bomQuery.isError ? (
          <EmptyState title="Failed to load BOM rows" description={bomQuery.error.message} />
        ) : currentSku ? (
          <DataTable columns={columns} data={rows} emptyMessage="No BOM rows yet." />
        ) : (
          <EmptyState title="Select a product" description="Choose a product to manage its BOM rows." />
        )}
      </div>
      <ModalFormShell
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) {
            setAddDraft(null);
          }
        }}
        title="Add BOM row"
        description="Tambah komponen BOM baru untuk produk yang sedang dipilih."
        submitLabel="Create BOM row"
        isSubmitting={actionPending}
        onSubmit={async () => {
          if (!addDraft) return;
          await saveBom(addDraft);
          setAddModalOpen(false);
          setAddDraft(null);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Group" htmlFor="add_bom_group">
            <SelectNative
              id="add_bom_group"
              value={addDraft?.component_group ?? "MAIN"}
              onChange={(event) =>
                setAddDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        component_group: asBomGroup(event.target.value),
                      }
                    : prev
                )
              }
            >
              {PRODUCT_BOM_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Type" htmlFor="add_bom_type">
            <SelectNative
              id="add_bom_type"
              value={addDraft?.component_type ?? "INVENTORY"}
              onChange={(event) =>
                setAddDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        component_type: event.target.value as (typeof PRODUCT_BOM_TYPE_OPTIONS)[number],
                      }
                    : prev
                )
              }
            >
              {PRODUCT_BOM_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Inventory ref" htmlFor="add_bom_inventory_ref">
            <SearchableSelect
              id="add_bom_inventory_ref"
              value={addDraft?.inv_code ?? ""}
              options={inventoryOptions}
              placeholder="Search inventory..."
              onValueChange={(next) => setAddDraft((prev) => (prev ? { ...prev, inv_code: next || null } : prev))}
            />
          </FormField>
          <FormField label="Component name" htmlFor="add_bom_component_name">
            <Input
              id="add_bom_component_name"
              value={addDraft?.component_name ?? ""}
              onChange={(event) =>
                setAddDraft((prev) => (prev ? { ...prev, component_name: event.target.value } : prev))
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <FormField label="Qty" htmlFor="add_bom_qty">
            <Input
              id="add_bom_qty"
              value={addDraft?.qty ?? "1"}
              onChange={(event) => setAddDraft((prev) => (prev ? { ...prev, qty: event.target.value } : prev))}
            />
          </FormField>
          <FormField label="Unit cost" htmlFor="add_bom_unit_cost">
            <Input
              id="add_bom_unit_cost"
              value={addDraft?.unit_cost ?? "0"}
              onChange={(event) =>
                setAddDraft((prev) => (prev ? { ...prev, unit_cost: event.target.value } : prev))
              }
            />
          </FormField>
          <FormField label="Sequence" htmlFor="add_bom_sequence">
            <Input
              id="add_bom_sequence"
              value={String(addDraft?.sequence_no ?? 1)}
              onChange={(event) =>
                setAddDraft((prev) =>
                  prev ? { ...prev, sequence_no: Number(event.target.value || 1) } : prev
                )
              }
            />
          </FormField>
          <FormField label="Status" htmlFor="add_bom_status">
            <SelectNative
              id="add_bom_status"
              value={String(addDraft?.is_active ?? true)}
              onChange={(event) =>
                setAddDraft((prev) => (prev ? { ...prev, is_active: parseBooleanInput(event.target.value) } : prev))
              }
            >
              {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Stock tracked" htmlFor="add_bom_stock_tracked">
            <SelectNative
              id="add_bom_stock_tracked"
              value={String(addDraft?.is_stock_tracked ?? true)}
              onChange={(event) =>
                setAddDraft((prev) =>
                  prev ? { ...prev, is_stock_tracked: parseBooleanInput(event.target.value) } : prev
                )
              }
            >
              {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Estimated line cost" htmlFor="add_bom_line_cost">
            <Input
              id="add_bom_line_cost"
              value={((Number(addDraft?.qty ?? "0") * Number(addDraft?.unit_cost ?? "0")) || 0).toFixed(2)}
              disabled
            />
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="add_bom_notes">
          <Textarea
            id="add_bom_notes"
            value={addDraft?.notes ?? ""}
            onChange={(event) => setAddDraft((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
          />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
