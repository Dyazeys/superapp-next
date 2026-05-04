"use client";

import { useCallback, useEffect, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_BOM_TYPE_OPTIONS,
  PRODUCT_BOOLEAN_OPTIONS,
  parseBooleanInput,
  createEmptyBomDraft,
  useProductCategories,
  useProductInventory,
  useProductMaster,
  useProductBom,
  useProductSelection,
} from "@/features/product/use-product-module";
import { asBomGroup } from "@/schemas/product-module";
import type {
  MasterInventoryRecord,
  MasterProductRecord,
  ProductBomRecord,
  ProductCategoryRecord,
} from "@/types/product";

const categoryColumnHelper = createColumnHelper<ProductCategoryRecord>();
const inventoryColumnHelper = createColumnHelper<MasterInventoryRecord>();
const productColumnHelper = createColumnHelper<MasterProductRecord>();
const bomColumnHelper = createColumnHelper<ProductBomRecord>();

function asBomType(value: string) {
  return PRODUCT_BOM_TYPE_OPTIONS.includes(value as (typeof PRODUCT_BOM_TYPE_OPTIONS)[number])
    ? (value as (typeof PRODUCT_BOM_TYPE_OPTIONS)[number])
    : "INVENTORY";
}

export function ProductWorkspace() {
  const {
    categoriesQuery,
    categoryForm,
    categoryModal,
    editingCategory,
    openCategoryModal,
    saveCategory,
    deleteCategory,
  } = useProductCategories();
  const {
    inventoryQuery,
    inventoryForm,
    inventoryModal,
    editingInventory,
    openInventoryModal,
    saveInventory,
    deleteInventory,
  } = useProductInventory();
  const {
    productsQuery,
    productForm,
    productModal,
    editingProduct,
    openProductModal,
    saveProduct,
    deleteProduct,
  } = useProductMaster();
  const { selectedSku, setSelectedSku } = useProductSelection();
  const {
    bomQuery,
    editingBomId,
    setEditingBomId,
    bomDraft,
    setBomDraft,
    saveBom,
    deleteBom,
    actionPending,
  } = useProductBom(selectedSku ?? undefined);

  useEffect(() => {
    if (!selectedSku && productsQuery.data?.length) {
      setSelectedSku(productsQuery.data[0].sku);
    }
  }, [productsQuery.data, selectedSku, setSelectedSku]);

  const categoryColumns = useMemo(
    () => [
      categoryColumnHelper.accessor("category_code", {
        header: "Code",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      categoryColumnHelper.accessor("category_name", { header: "Category" }),
      categoryColumnHelper.accessor("parent_category_code", {
        header: "Parent",
        cell: (info) => info.getValue() ?? "-",
      }),
      categoryColumnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? "Active" : "Inactive"}
            tone={info.getValue() ? "success" : "neutral"}
          />
        ),
      }),
      categoryColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openCategoryModal(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                if (window.confirm("Hapus kategori ini?")) deleteCategory(row.original.category_code);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    [deleteCategory, openCategoryModal]
  );

  const inventoryColumns = useMemo(
    () => [
      inventoryColumnHelper.accessor("inv_code", {
        header: "Code",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      inventoryColumnHelper.accessor("inv_name", { header: "Inventory" }),
      inventoryColumnHelper.accessor("unit_cost", { header: "Unit Cost" }),
      inventoryColumnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? "Active" : "Inactive"}
            tone={info.getValue() ? "success" : "neutral"}
          />
        ),
      }),
      inventoryColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openInventoryModal(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                if (window.confirm("Hapus inventory ini?")) deleteInventory(row.original.inv_code);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    [deleteInventory, openInventoryModal]
  );

  const productColumns = useMemo(
    () => [
      productColumnHelper.accessor("sku", {
        header: "SKU",
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="font-medium text-left"
            onClick={() => setSelectedSku(row.original.sku)}
          >
            {getValue()}
          </button>
        ),
      }),
      productColumnHelper.accessor("product_name", { header: "Product" }),
      productColumnHelper.accessor("category_code", {
        header: "Category",
        cell: (info) => info.row.original.category_product?.category_name ?? info.getValue() ?? "-",
      }),
      productColumnHelper.accessor("total_hpp", { header: "Total HPP" }),
      productColumnHelper.display({
        id: "bom",
        header: "BOM",
        cell: ({ row }) => (
          <StatusBadge
            label={`${row.original._count?.product_bom ?? 0} rows`}
            tone="info"
          />
        ),
      }),
      productColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setSelectedSku(row.original.sku)}
            >
              BOM
            </Button>
            <Button size="icon-xs" variant="outline" onClick={() => openProductModal(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                if (window.confirm("Hapus produk ini?")) deleteProduct(row.original.sku);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    [deleteProduct, openProductModal, setSelectedSku]
  );

  const bomRows = useMemo(() => {
    const rows = bomQuery.data ?? [];
    if (bomDraft && !editingBomId) {
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
        ...rows,
      ];
    }
    return rows;
  }, [bomDraft, bomQuery.data, editingBomId]);

  const isEditingBomRow = useCallback(
    (id: string) => editingBomId === id || (id === "__new__" && !editingBomId && Boolean(bomDraft)),
    [bomDraft, editingBomId]
  );

  const bomColumns = useMemo(
    () => [
      bomColumnHelper.accessor("sequence_no", {
        header: "#",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              value={String(bomDraft?.sequence_no ?? getValue())}
              onChange={(e) =>
                setBomDraft((c) =>
                  c ? { ...c, sequence_no: Number(e.target.value || 1) } : c
                )
              }
              className="h-8 w-16"
            />
          ) : (
            getValue()
          ),
      }),
      bomColumnHelper.accessor("component_group", {
        header: "Group",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              value={bomDraft?.component_group ?? getValue()}
              onChange={(e) =>
                setBomDraft((c) =>
                  c ? { ...c, component_group: asBomGroup(e.target.value) } : c
                )
              }
              className="h-8 min-w-[110px]"
            />
          ) : (
            getValue()
          ),
      }),
      bomColumnHelper.accessor("component_type", {
        header: "Type",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              list="bom-component-types"
              value={bomDraft?.component_type ?? getValue()}
              onChange={(e) =>
                setBomDraft((c) =>
                  c ? { ...c, component_type: asBomType(e.target.value) } : c
                )
              }
              className="h-8 min-w-[130px]"
            />
          ) : (
            getValue()
          ),
      }),
      bomColumnHelper.accessor("inv_code", {
        header: "Inventory Ref",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              list="inventory-codes"
              value={bomDraft?.inv_code ?? getValue() ?? ""}
              onChange={(e) =>
                setBomDraft((c) =>
                  c ? { ...c, inv_code: e.target.value || null } : c
                )
              }
              className="h-8 min-w-[150px]"
            />
          ) : (
            getValue() ?? "-"
          ),
      }),
      bomColumnHelper.accessor("component_name", {
        header: "Component",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              value={bomDraft?.component_name ?? getValue()}
              onChange={(e) =>
                setBomDraft((c) =>
                  c ? { ...c, component_name: e.target.value } : c
                )
              }
              className="h-8 min-w-[170px]"
            />
          ) : (
            getValue()
          ),
      }),
      bomColumnHelper.accessor("qty", {
        header: "Qty",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              value={bomDraft?.qty ?? getValue()}
              onChange={(e) =>
                setBomDraft((c) => (c ? { ...c, qty: e.target.value } : c))
              }
              className="h-8 w-20"
            />
          ) : (
            getValue()
          ),
      }),
      bomColumnHelper.accessor("unit_cost", {
        header: "Unit Cost",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              value={bomDraft?.unit_cost ?? getValue()}
              onChange={(e) =>
                setBomDraft((c) => (c ? { ...c, unit_cost: e.target.value } : c))
              }
              className="h-8 w-24"
            />
          ) : (
            getValue()
          ),
      }),
      bomColumnHelper.display({
        id: "line_cost",
        header: "Line Cost",
        cell: ({ row }) =>
          isEditingBomRow(row.original.id)
            ? (
                Number(bomDraft?.qty ?? row.original.qty) *
                Number(bomDraft?.unit_cost ?? row.original.unit_cost)
              ).toFixed(2)
            : row.original.line_cost,
      }),
      bomColumnHelper.accessor("is_active", {
        header: "Status",
        cell: ({ row, getValue }) =>
          isEditingBomRow(row.original.id) ? (
            <Input
              list="boolean-values"
              value={String(bomDraft?.is_active ?? getValue())}
              onChange={(e) =>
                setBomDraft((c) =>
                  c ? { ...c, is_active: parseBooleanInput(e.target.value) } : c
                )
              }
              className="h-8 w-24"
            />
          ) : (
            <StatusBadge
              label={getValue() ? "Active" : "Inactive"}
              tone={getValue() ? "success" : "neutral"}
            />
          ),
      }),
      bomColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) =>
          isEditingBomRow(row.original.id) ? (
            <div className="flex justify-end gap-2">
              <Button
                size="icon-xs"
                variant="outline"
                disabled={actionPending}
                onClick={() => bomDraft && saveBom(bomDraft)}
              >
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
                  setBomDraft({
                    sku: row.original.sku,
                    component_group: asBomGroup(row.original.component_group),
                    component_type: asBomType(row.original.component_type),
                    inv_code: row.original.inv_code,
                    component_name: row.original.component_name,
                    qty: row.original.qty,
                    unit_cost: row.original.unit_cost,
                    is_stock_tracked: row.original.is_stock_tracked,
                    notes: row.original.notes ?? "",
                    sequence_no: row.original.sequence_no,
                    is_active: row.original.is_active,
                  });
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="outline"
                disabled={actionPending}
                onClick={() => {
                  if (window.confirm("Hapus baris BOM ini?")) deleteBom(row.original.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ),
      }),
    ],
    [
      bomDraft,
      saveBom,
      deleteBom,
      isEditingBomRow,
      actionPending,
      setEditingBomId,
      setBomDraft,
    ]
  );

  return (
    <div className="space-y-6">
      <datalist id="inventory-codes">
        {(inventoryQuery.data ?? []).map((item) => (
          <option key={item.inv_code} value={item.inv_code} />
        ))}
      </datalist>
      <datalist id="category-codes">
        {(categoriesQuery.data ?? []).map((item) => (
          <option key={item.category_code} value={item.category_code} />
        ))}
      </datalist>
      <datalist id="bom-component-types">
        <option value="INVENTORY" />
        <option value="NON_INVENTORY" />
      </datalist>

      <section className="grid gap-6 xl:grid-cols-3">
        <WorkspacePanel
          title="Product Categories"
          description="Existing category hierarchy from the current product schema."
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openCategoryModal()}>
                <Plus className="size-4" />
                Add category
              </Button>
            </div>
            <DataTable
              columns={categoryColumns}
              data={categoriesQuery.data ?? []}
              emptyMessage="No product categories found."
            />
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Master Inventory"
          description="Inventory references reused by products and BOM components."
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openInventoryModal()}>
                <Plus className="size-4" />
                Add inventory
              </Button>
            </div>
            <DataTable
              columns={inventoryColumns}
              data={inventoryQuery.data ?? []}
              emptyMessage="No inventory records found."
            />
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Master Products"
          description="Compact product list with BOM coverage."
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openProductModal()}>
                <Plus className="size-4" />
                Add product
              </Button>
            </div>
            <DataTable
              columns={productColumns}
              data={productsQuery.data ?? []}
              emptyMessage="No master products found."
            />
          </div>
        </WorkspacePanel>
      </section>

      <WorkspacePanel
        title="Product BOM"
        description="BOM rows use inline editing for row-level updates on the selected product."
      >
        {selectedSku ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{selectedSku}</p>
                <p className="text-sm text-muted-foreground">
                  {(productsQuery.data ?? []).find((item) => item.sku === selectedSku)?.product_name ??
                    "Selected product"}
                </p>
              </div>
              <Button
                size="sm"
                disabled={actionPending}
                onClick={() => selectedSku && !editingBomId && setBomDraft(createEmptyBomDraft(selectedSku))}
              >
                <Plus className="size-4" />
                Add BOM row
              </Button>
            </div>
            <DataTable
              columns={bomColumns}
              data={bomRows}
              emptyMessage="No BOM rows found for this product."
            />
          </div>
        ) : (
          <EmptyState
            title="Select a product"
            description="Choose a product from the master product table to manage its BOM rows."
          />
        )}
      </WorkspacePanel>

      <ModalFormShell
        open={categoryModal.open}
        onOpenChange={categoryModal.setOpen}
        title={editingCategory ? "Edit category" : "Create category"}
        description="Modal CRUD flow for product categories."
        submitLabel={editingCategory ? "Save changes" : "Create category"}
        isSubmitting={categoryForm.formState.isSubmitting}
        onSubmit={categoryForm.handleSubmit((values) => saveCategory(values))}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Category code"
            htmlFor="category_code"
            error={categoryForm.formState.errors.category_code?.message}
          >
            <Input
              id="category_code"
              {...categoryForm.register("category_code")}
              disabled={Boolean(editingCategory)}
            />
          </FormField>
          <FormField label="Parent category" htmlFor="parent_category_code">
            <Input
              id="parent_category_code"
              list="category-codes"
              {...categoryForm.register("parent_category_code")}
            />
          </FormField>
        </div>
        <FormField
          label="Category name"
          htmlFor="category_name"
          error={categoryForm.formState.errors.category_name?.message}
        >
          <Input id="category_name" {...categoryForm.register("category_name")} />
        </FormField>
        <FormField label="Active" htmlFor="category_active">
          <SelectNative
            id="category_active"
            value={String(categoryForm.watch("is_active"))}
            onChange={(e) => categoryForm.setValue("is_active", parseBooleanInput(e.target.value))}
          >
            {PRODUCT_BOOLEAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectNative>
        </FormField>
      </ModalFormShell>

      <ModalFormShell
        open={inventoryModal.open}
        onOpenChange={inventoryModal.setOpen}
        title={editingInventory ? "Edit inventory" : "Create inventory"}
        description="Modal CRUD flow for inventory references."
        submitLabel={editingInventory ? "Save changes" : "Create inventory"}
        isSubmitting={inventoryForm.formState.isSubmitting}
        onSubmit={inventoryForm.handleSubmit((values) => saveInventory(values))}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Inventory code"
            htmlFor="inv_code"
            error={inventoryForm.formState.errors.inv_code?.message}
          >
            <Input
              id="inv_code"
              {...inventoryForm.register("inv_code")}
              disabled={Boolean(editingInventory)}
            />
          </FormField>
          <FormField
            label="Inventory name"
            htmlFor="inv_name"
            error={inventoryForm.formState.errors.inv_name?.message}
          >
            <Input id="inv_name" {...inventoryForm.register("inv_name")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Unit Cost"
            htmlFor="unit_cost"
            error={inventoryForm.formState.errors.unit_cost?.message}
          >
            <Input id="unit_cost" {...inventoryForm.register("unit_cost")} />
          </FormField>
          <FormField label="Active" htmlFor="inventory_active">
            <SelectNative
              id="inventory_active"
              value={String(inventoryForm.watch("is_active"))}
              onChange={(e) => inventoryForm.setValue("is_active", parseBooleanInput(e.target.value))}
            >
              {PRODUCT_BOOLEAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" {...inventoryForm.register("description")} />
        </FormField>
      </ModalFormShell>

      <ModalFormShell
        open={productModal.open}
        onOpenChange={productModal.setOpen}
        title={editingProduct ? "Edit product" : "Create product"}
        description="Modal CRUD flow for master products."
        submitLabel={editingProduct ? "Save changes" : "Create product"}
        isSubmitting={productForm.formState.isSubmitting}
        onSubmit={productForm.handleSubmit((values) => saveProduct(values))}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="SKU"
            htmlFor="sku"
            error={productForm.formState.errors.sku?.message}
          >
            <Input
              id="sku"
              {...productForm.register("sku")}
              disabled={Boolean(editingProduct)}
            />
          </FormField>
          <FormField label="Category code" htmlFor="category_code">
            <Input
              id="category_code"
              list="category-codes"
              {...productForm.register("category_code")}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="SKU name"
            htmlFor="sku_name"
            error={productForm.formState.errors.sku_name?.message}
          >
            <Input id="sku_name" {...productForm.register("sku_name")} />
          </FormField>
          <FormField
            label="Product name"
            htmlFor="product_name"
            error={productForm.formState.errors.product_name?.message}
          >
            <Input id="product_name" {...productForm.register("product_name")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Color" htmlFor="color">
            <Input id="color" {...productForm.register("color")} />
          </FormField>
          <FormField label="Color code" htmlFor="color_code">
            <Input id="color_code" {...productForm.register("color_code")} />
          </FormField>
          <FormField label="Size" htmlFor="size">
            <Input id="size" {...productForm.register("size")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Variation" htmlFor="variations">
            <Input id="variations" {...productForm.register("variations")} />
          </FormField>
          <FormField label="Busa code" htmlFor="busa_code">
            <Input id="busa_code" {...productForm.register("busa_code")} />
          </FormField>
          <FormField label="Bundling" htmlFor="is_bundling">
            <SelectNative
              id="is_bundling"
              value={String(productForm.watch("is_bundling"))}
              onChange={(e) => productForm.setValue("is_bundling", parseBooleanInput(e.target.value))}
            >
              {PRODUCT_BOOLEAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Main inventory" htmlFor="inv_main">
            <Input
              id="inv_main"
              list="inventory-codes"
              {...productForm.register("inv_main")}
            />
          </FormField>
          <FormField label="Accessory inventory" htmlFor="inv_acc">
            <Input
              id="inv_acc"
              list="inventory-codes"
              {...productForm.register("inv_acc")}
            />
          </FormField>
        </div>
        <FormField label="Total HPP" htmlFor="total_hpp">
          <Input id="total_hpp" {...productForm.register("total_hpp")} />
        </FormField>
        <FormField label="Active" htmlFor="product_active">
          <SelectNative
            id="product_active"
            value={String(productForm.watch("is_active"))}
            onChange={(e) => productForm.setValue("is_active", parseBooleanInput(e.target.value))}
          >
            {PRODUCT_BOOLEAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectNative>
        </FormField>
      </ModalFormShell>
    </div>
  );
}
