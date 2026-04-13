/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModalState } from "@/hooks/use-modal-state";
import { productApi } from "@/features/product/api";
import {
  masterInventorySchema,
  masterProductSchema,
  productCategorySchema,
  type MasterInventoryInput,
  type MasterProductInput,
  type ProductBomInput,
  type ProductCategoryInput,
} from "@/schemas/product-module";
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

function asBool(value: string) {
  return value === "true";
}

function emptyBomDraft(sku: string): ProductBomInput {
  return {
    sku,
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
  };
}

export function ProductWorkspace() {
  const queryClient = useQueryClient();
  const categoryModal = useModalState();
  const inventoryModal = useModalState();
  const productModal = useModalState();

  const [editingCategory, setEditingCategory] = useState<ProductCategoryRecord | null>(null);
  const [editingInventory, setEditingInventory] = useState<MasterInventoryRecord | null>(null);
  const [editingProduct, setEditingProduct] = useState<MasterProductRecord | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [editingBomId, setEditingBomId] = useState<string | null>(null);
  const [bomDraft, setBomDraft] = useState<ProductBomInput | null>(null);

  const categoriesQuery = useQuery({ queryKey: ["product-categories"], queryFn: productApi.categories.list });
  const inventoryQuery = useQuery({ queryKey: ["product-inventory"], queryFn: productApi.inventory.list });
  const productsQuery = useQuery({ queryKey: ["product-products"], queryFn: productApi.products.list });
  const bomQuery = useQuery({
    queryKey: ["product-bom", selectedSku],
    queryFn: () => productApi.products.bom.list(selectedSku!),
    enabled: Boolean(selectedSku),
  });

  useEffect(() => {
    if (!selectedSku && productsQuery.data?.length) {
      setSelectedSku(productsQuery.data[0].sku);
    }
  }, [productsQuery.data, selectedSku]);

  const categoryForm = useForm({
    resolver: zodResolver(productCategorySchema),
    defaultValues: { category_code: "", parent_category_code: null, category_name: "", is_active: true },
  });
  const inventoryForm = useForm({
    resolver: zodResolver(masterInventorySchema),
    defaultValues: { inv_code: "", inv_name: "", description: "", hpp: "0", is_active: true },
  });
  const productForm = useForm({
    resolver: zodResolver(masterProductSchema),
    defaultValues: {
      sku: "",
      category_code: null,
      sku_name: "",
      product_name: "",
      color: "",
      color_code: "",
      size: "",
      variations: "",
      busa_code: "",
      inv_main: null,
      inv_acc: null,
      is_bundling: false,
      is_active: true,
      total_hpp: "0",
    },
  });

  async function invalidateAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["product-categories"] }),
      queryClient.invalidateQueries({ queryKey: ["product-inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["product-products"] }),
      queryClient.invalidateQueries({ queryKey: ["product-bom"] }),
    ]);
  }

  const categoryMutation = useMutation({
    mutationFn: (payload: ProductCategoryInput) =>
      editingCategory
        ? productApi.categories.update(editingCategory.category_code, payload)
        : productApi.categories.create(payload),
    onSuccess: async () => {
      toast.success(`Category ${editingCategory ? "updated" : "created"}`);
      await invalidateAll();
      categoryModal.closeModal();
      setEditingCategory(null);
      categoryForm.reset();
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: (payload: MasterInventoryInput) =>
      editingInventory
        ? productApi.inventory.update(editingInventory.inv_code, payload)
        : productApi.inventory.create(payload),
    onSuccess: async () => {
      toast.success(`Inventory ${editingInventory ? "updated" : "created"}`);
      await invalidateAll();
      inventoryModal.closeModal();
      setEditingInventory(null);
      inventoryForm.reset();
    },
  });

  const productMutation = useMutation({
    mutationFn: (payload: MasterProductInput) =>
      editingProduct ? productApi.products.update(editingProduct.sku, payload) : productApi.products.create(payload),
    onSuccess: async (product) => {
      toast.success(`Product ${editingProduct ? "updated" : "created"}`);
      await invalidateAll();
      productModal.closeModal();
      setEditingProduct(null);
      setSelectedSku(product.sku);
      productForm.reset();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: productApi.categories.remove,
    onSuccess: async () => {
      toast.success("Category deleted");
      await invalidateAll();
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: productApi.inventory.remove,
    onSuccess: async () => {
      toast.success("Inventory deleted");
      await invalidateAll();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.products.remove,
    onSuccess: async () => {
      toast.success("Product deleted");
      await invalidateAll();
      setSelectedSku(null);
    },
  });

  const bomMutation = useMutation({
    mutationFn: (payload: ProductBomInput) => {
      if (!selectedSku) throw new Error("Select a product first");
      const body = Object.fromEntries(
        Object.entries(payload).filter(([key]) => key !== "sku")
      ) as Omit<ProductBomInput, "sku">;
      return editingBomId
        ? productApi.products.bom.update(selectedSku, editingBomId, body)
        : productApi.products.bom.create(selectedSku, body);
    },
    onSuccess: async () => {
      toast.success(`BOM row ${editingBomId ? "updated" : "created"}`);
      await invalidateAll();
      setEditingBomId(null);
      setBomDraft(null);
    },
  });

  const deleteBomMutation = useMutation({
    mutationFn: ({ sku, id }: { sku: string; id: string }) => productApi.products.bom.remove(sku, id),
    onSuccess: async () => {
      toast.success("BOM row deleted");
      await invalidateAll();
      setEditingBomId(null);
      setBomDraft(null);
    },
  });

  const openCategoryModal = useCallback((category?: ProductCategoryRecord) => {
    setEditingCategory(category ?? null);
    categoryForm.reset({
      category_code: category?.category_code ?? "",
      parent_category_code: category?.parent_category_code ?? null,
      category_name: category?.category_name ?? "",
      is_active: category?.is_active ?? true,
    });
    categoryModal.openModal();
  }, [categoryForm, categoryModal]);

  const openInventoryModal = useCallback((inventory?: MasterInventoryRecord) => {
    setEditingInventory(inventory ?? null);
    inventoryForm.reset({
      inv_code: inventory?.inv_code ?? "",
      inv_name: inventory?.inv_name ?? "",
      description: inventory?.description ?? "",
      hpp: inventory?.hpp ?? "0",
      is_active: inventory?.is_active ?? true,
    });
    inventoryModal.openModal();
  }, [inventoryForm, inventoryModal]);

  const openProductModal = useCallback((product?: MasterProductRecord) => {
    setEditingProduct(product ?? null);
    productForm.reset({
      sku: product?.sku ?? "",
      category_code: product?.category_code ?? null,
      sku_name: product?.sku_name ?? "",
      product_name: product?.product_name ?? "",
      color: product?.color ?? "",
      color_code: product?.color_code ?? "",
      size: product?.size ?? "",
      variations: product?.variations ?? "",
      busa_code: product?.busa_code ?? "",
      inv_main: product?.inv_main ?? null,
      inv_acc: product?.inv_acc ?? null,
      is_bundling: product?.is_bundling ?? false,
      is_active: product?.is_active ?? true,
      total_hpp: product?.total_hpp ?? "0",
    });
    productModal.openModal();
  }, [productForm, productModal]);

  const categoryColumns = useMemo(
    () => [
      categoryColumnHelper.accessor("category_code", { header: "Code", cell: (info) => <span className="font-medium">{info.getValue()}</span> }),
      categoryColumnHelper.accessor("category_name", { header: "Category" }),
      categoryColumnHelper.accessor("parent_category_code", { header: "Parent", cell: (info) => info.getValue() ?? "-" }),
      categoryColumnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />,
      }),
      categoryColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openCategoryModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteCategoryMutation.mutate(row.original.category_code)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteCategoryMutation, openCategoryModal]
  );

  const inventoryColumns = useMemo(
    () => [
      inventoryColumnHelper.accessor("inv_code", { header: "Code", cell: (info) => <span className="font-medium">{info.getValue()}</span> }),
      inventoryColumnHelper.accessor("inv_name", { header: "Inventory" }),
      inventoryColumnHelper.accessor("hpp", { header: "HPP" }),
      inventoryColumnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />,
      }),
      inventoryColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openInventoryModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteInventoryMutation.mutate(row.original.inv_code)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteInventoryMutation, openInventoryModal]
  );

  const productColumns = useMemo(
    () => [
      productColumnHelper.accessor("sku", {
        header: "SKU",
        cell: ({ row, getValue }) => <button type="button" className="font-medium text-left" onClick={() => setSelectedSku(row.original.sku)}>{getValue()}</button>,
      }),
      productColumnHelper.accessor("product_name", { header: "Product" }),
      productColumnHelper.accessor("category_code", { header: "Category", cell: (info) => info.row.original.category_product?.category_name ?? info.getValue() ?? "-" }),
      productColumnHelper.accessor("total_hpp", { header: "Total HPP" }),
      productColumnHelper.display({ id: "bom", header: "BOM", cell: ({ row }) => <StatusBadge label={`${row.original._count?.product_bom ?? 0} rows`} tone="info" /> }),
      productColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => setSelectedSku(row.original.sku)}>BOM</Button>
            <Button size="icon-xs" variant="outline" onClick={() => openProductModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteProductMutation.mutate(row.original.sku)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteProductMutation, openProductModal]
  );

  const bomRows = useMemo(() => {
    const rows = bomQuery.data ?? [];
    if (bomDraft && !editingBomId) {
      return [{
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
      }, ...rows];
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
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input value={String(bomDraft?.sequence_no ?? getValue())} onChange={(e) => setBomDraft((c) => c ? { ...c, sequence_no: Number(e.target.value || 1) } : c)} className="h-8 w-16" /> : getValue(),
      }),
      bomColumnHelper.accessor("component_group", {
        header: "Group",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input value={bomDraft?.component_group ?? getValue()} onChange={(e) => setBomDraft((c) => c ? { ...c, component_group: e.target.value } : c)} className="h-8 min-w-[110px]" /> : getValue(),
      }),
      bomColumnHelper.accessor("component_type", {
        header: "Type",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input list="bom-component-types" value={bomDraft?.component_type ?? getValue()} onChange={(e) => setBomDraft((c) => c ? { ...c, component_type: e.target.value } : c)} className="h-8 min-w-[130px]" /> : getValue(),
      }),
      bomColumnHelper.accessor("inv_code", {
        header: "Inventory Ref",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input list="inventory-codes" value={bomDraft?.inv_code ?? getValue() ?? ""} onChange={(e) => setBomDraft((c) => c ? { ...c, inv_code: e.target.value || null } : c)} className="h-8 min-w-[150px]" /> : getValue() ?? "-",
      }),
      bomColumnHelper.accessor("component_name", {
        header: "Component",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input value={bomDraft?.component_name ?? getValue()} onChange={(e) => setBomDraft((c) => c ? { ...c, component_name: e.target.value } : c)} className="h-8 min-w-[170px]" /> : getValue(),
      }),
      bomColumnHelper.accessor("qty", {
        header: "Qty",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input value={bomDraft?.qty ?? getValue()} onChange={(e) => setBomDraft((c) => c ? { ...c, qty: e.target.value } : c)} className="h-8 w-20" /> : getValue(),
      }),
      bomColumnHelper.accessor("unit_cost", {
        header: "Unit Cost",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input value={bomDraft?.unit_cost ?? getValue()} onChange={(e) => setBomDraft((c) => c ? { ...c, unit_cost: e.target.value } : c)} className="h-8 w-24" /> : getValue(),
      }),
      bomColumnHelper.display({
        id: "line_cost",
        header: "Line Cost",
        cell: ({ row }) => isEditingBomRow(row.original.id) ? (Number(bomDraft?.qty ?? row.original.qty) * Number(bomDraft?.unit_cost ?? row.original.unit_cost)).toFixed(2) : row.original.line_cost,
      }),
      bomColumnHelper.accessor("is_active", {
        header: "Status",
        cell: ({ row, getValue }) => isEditingBomRow(row.original.id) ? <Input list="boolean-values" value={String(bomDraft?.is_active ?? getValue())} onChange={(e) => setBomDraft((c) => c ? { ...c, is_active: asBool(e.target.value) } : c)} className="h-8 w-24" /> : <StatusBadge label={getValue() ? "Active" : "Inactive"} tone={getValue() ? "success" : "neutral"} />,
      }),
      bomColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => isEditingBomRow(row.original.id) ? (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => bomDraft && bomMutation.mutate(bomDraft)}><Save className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => { setEditingBomId(null); setBomDraft(null); }}><X className="size-3.5" /></Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => { setEditingBomId(row.original.id); setBomDraft({ sku: row.original.sku, component_group: row.original.component_group, component_type: row.original.component_type, inv_code: row.original.inv_code, component_name: row.original.component_name, qty: row.original.qty, unit_cost: row.original.unit_cost, is_stock_tracked: row.original.is_stock_tracked, notes: row.original.notes ?? "", sequence_no: row.original.sequence_no, is_active: row.original.is_active }); }}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => selectedSku && deleteBomMutation.mutate({ sku: selectedSku, id: row.original.id })}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [bomDraft, bomMutation, deleteBomMutation, isEditingBomRow, selectedSku]
  );

  return (
    <div className="space-y-6">
      <datalist id="inventory-codes">{(inventoryQuery.data ?? []).map((item) => <option key={item.inv_code} value={item.inv_code} />)}</datalist>
      <datalist id="category-codes">{(categoriesQuery.data ?? []).map((item) => <option key={item.category_code} value={item.category_code} />)}</datalist>
      <datalist id="bom-component-types"><option value="INVENTORY" /><option value="NON_INVENTORY" /></datalist>
      <datalist id="boolean-values"><option value="true" /><option value="false" /></datalist>

      <section className="grid gap-6 xl:grid-cols-3">
        <WorkspacePanel title="Product Categories" description="Existing category hierarchy from the current product schema.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openCategoryModal()}><Plus className="size-4" />Add category</Button></div>
            <DataTable columns={categoryColumns} data={categoriesQuery.data ?? []} emptyMessage="No product categories found." />
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Master Inventory" description="Inventory references reused by products and BOM components.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openInventoryModal()}><Plus className="size-4" />Add inventory</Button></div>
            <DataTable columns={inventoryColumns} data={inventoryQuery.data ?? []} emptyMessage="No inventory records found." />
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Master Products" description="Compact product list with BOM coverage.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openProductModal()}><Plus className="size-4" />Add product</Button></div>
            <DataTable columns={productColumns} data={productsQuery.data ?? []} emptyMessage="No master products found." />
          </div>
        </WorkspacePanel>
      </section>

      <WorkspacePanel title="Product BOM" description="BOM rows use inline editing for row-level updates on the selected product.">
        {selectedSku ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{selectedSku}</p>
                <p className="text-sm text-muted-foreground">{(productsQuery.data ?? []).find((item) => item.sku === selectedSku)?.product_name ?? "Selected product"}</p>
              </div>
              <Button size="sm" onClick={() => selectedSku && setBomDraft(emptyBomDraft(selectedSku))}><Plus className="size-4" />Add BOM row</Button>
            </div>
            <DataTable columns={bomColumns} data={bomRows} emptyMessage="No BOM rows found for this product." />
          </div>
        ) : (
          <EmptyState title="Select a product" description="Choose a product from the master product table to manage its BOM rows." />
        )}
      </WorkspacePanel>

      <ModalFormShell open={categoryModal.open} onOpenChange={categoryModal.setOpen} title={editingCategory ? "Edit category" : "Create category"} description="Modal CRUD flow for product categories." submitLabel={editingCategory ? "Save changes" : "Create category"} onSubmit={categoryForm.handleSubmit((values) => categoryMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Category code" htmlFor="category_code" error={categoryForm.formState.errors.category_code?.message}><Input id="category_code" {...categoryForm.register("category_code")} disabled={Boolean(editingCategory)} /></FormField>
          <FormField label="Parent category" htmlFor="parent_category_code"><Input id="parent_category_code" list="category-codes" {...categoryForm.register("parent_category_code")} /></FormField>
        </div>
        <FormField label="Category name" htmlFor="category_name" error={categoryForm.formState.errors.category_name?.message}><Input id="category_name" {...categoryForm.register("category_name")} /></FormField>
        <FormField label="Active" htmlFor="category_active"><Input id="category_active" list="boolean-values" value={String(categoryForm.watch("is_active"))} onChange={(e) => categoryForm.setValue("is_active", asBool(e.target.value))} /></FormField>
      </ModalFormShell>

      <ModalFormShell open={inventoryModal.open} onOpenChange={inventoryModal.setOpen} title={editingInventory ? "Edit inventory" : "Create inventory"} description="Modal CRUD flow for inventory references." submitLabel={editingInventory ? "Save changes" : "Create inventory"} onSubmit={inventoryForm.handleSubmit((values) => inventoryMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Inventory code" htmlFor="inv_code" error={inventoryForm.formState.errors.inv_code?.message}><Input id="inv_code" {...inventoryForm.register("inv_code")} disabled={Boolean(editingInventory)} /></FormField>
          <FormField label="Inventory name" htmlFor="inv_name" error={inventoryForm.formState.errors.inv_name?.message}><Input id="inv_name" {...inventoryForm.register("inv_name")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="HPP" htmlFor="hpp" error={inventoryForm.formState.errors.hpp?.message}><Input id="hpp" {...inventoryForm.register("hpp")} /></FormField>
          <FormField label="Active" htmlFor="inventory_active"><Input id="inventory_active" list="boolean-values" value={String(inventoryForm.watch("is_active"))} onChange={(e) => inventoryForm.setValue("is_active", asBool(e.target.value))} /></FormField>
        </div>
        <FormField label="Description" htmlFor="description"><Textarea id="description" {...inventoryForm.register("description")} /></FormField>
      </ModalFormShell>

      <ModalFormShell open={productModal.open} onOpenChange={productModal.setOpen} title={editingProduct ? "Edit product" : "Create product"} description="Modal CRUD flow for master products." submitLabel={editingProduct ? "Save changes" : "Create product"} onSubmit={productForm.handleSubmit((values) => productMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="SKU" htmlFor="sku" error={productForm.formState.errors.sku?.message}><Input id="sku" {...productForm.register("sku")} disabled={Boolean(editingProduct)} /></FormField>
          <FormField label="Category code" htmlFor="category_code"><Input id="category_code" list="category-codes" {...productForm.register("category_code")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="SKU name" htmlFor="sku_name" error={productForm.formState.errors.sku_name?.message}><Input id="sku_name" {...productForm.register("sku_name")} /></FormField>
          <FormField label="Product name" htmlFor="product_name" error={productForm.formState.errors.product_name?.message}><Input id="product_name" {...productForm.register("product_name")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Color" htmlFor="color"><Input id="color" {...productForm.register("color")} /></FormField>
          <FormField label="Color code" htmlFor="color_code"><Input id="color_code" {...productForm.register("color_code")} /></FormField>
          <FormField label="Size" htmlFor="size"><Input id="size" {...productForm.register("size")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Variation" htmlFor="variations"><Input id="variations" {...productForm.register("variations")} /></FormField>
          <FormField label="Busa code" htmlFor="busa_code"><Input id="busa_code" {...productForm.register("busa_code")} /></FormField>
          <FormField label="Bundling" htmlFor="is_bundling"><Input id="is_bundling" list="boolean-values" value={String(productForm.watch("is_bundling"))} onChange={(e) => productForm.setValue("is_bundling", asBool(e.target.value))} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Main inventory" htmlFor="inv_main"><Input id="inv_main" list="inventory-codes" {...productForm.register("inv_main")} /></FormField>
          <FormField label="Accessory inventory" htmlFor="inv_acc"><Input id="inv_acc" list="inventory-codes" {...productForm.register("inv_acc")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <FormField label="Total HPP" htmlFor="total_hpp"><Input id="total_hpp" {...productForm.register("total_hpp")} /></FormField>
        </div>
        <FormField label="Active" htmlFor="product_active"><Input id="product_active" list="boolean-values" value={String(productForm.watch("is_active"))} onChange={(e) => productForm.setValue("is_active", asBool(e.target.value))} /></FormField>
      </ModalFormShell>
    </div>
  );
}
