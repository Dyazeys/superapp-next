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
  PRODUCT_BOOLEAN_OPTIONS,
  parseBooleanInput,
  useProductCategories,
  useProductInventory,
  useProductMaster,
} from "@/features/product/use-product-module";
import type { MasterProductInput } from "@/schemas/product-module";
import type { MasterProductRecord } from "@/types/product";

const columnHelper = createColumnHelper<MasterProductRecord>();

export default function ProductMasterPage() {
  const hooks = useProductMaster();
  const categories = useProductCategories();
  const inventory = useProductInventory();
  const { productsQuery, productForm, productModal, editingProduct, openProductModal, deleteProduct } = hooks;

  const columns = [
    columnHelper.accessor("sku", {
      header: "SKU",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("product_name", { header: "Product" }),
    columnHelper.accessor("category_code", {
      header: "Category",
      cell: (info) => info.row.original.category_product?.category_name ?? info.getValue() ?? "-",
    }),
    columnHelper.accessor("inv_main", {
      header: "Main Inventory",
      cell: (info) =>
        info.row.original.master_inventory_master_product_inv_mainTomaster_inventory?.inv_name ?? info.getValue() ?? "-",
    }),
    columnHelper.accessor("price_mp", { header: "MP Price" }),
    columnHelper.accessor("total_hpp", { header: "Total HPP" }),
    columnHelper.display({
      id: "bom",
      header: "BOM",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.product_bom ?? 0} rows`} tone="info" />,
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
          <Button size="icon-xs" variant="outline" onClick={() => openProductModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => deleteProduct(row.original.sku)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Product"
      title="Master Products"
      description="Manage master SKUs, product categorization, inventory references, and pricing from one modal CRUD flow."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => openProductModal()}>
            <Plus className="size-4" />
            Add product
          </Button>
        </div>
        <DataTable columns={columns} data={productsQuery.data ?? []} emptyMessage="No master products yet." />
      </div>

      <ModalFormShell
        open={productModal.open}
        onOpenChange={productModal.setOpen}
        title={editingProduct ? "Edit product" : "Create product"}
        description="Manage product records with shared category and inventory references."
        isSubmitting={productForm.formState.isSubmitting}
        onSubmit={() => {
          return productForm.handleSubmit((values: MasterProductInput) => hooks.saveProduct(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="SKU" htmlFor="sku" error={productForm.formState.errors.sku?.message}>
            <Input id="sku" {...productForm.register("sku")} disabled={Boolean(editingProduct)} />
          </FormField>
          <FormField label="Category code" htmlFor="category_code">
            <Input id="category_code" list="product-category-codes" {...productForm.register("category_code")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="SKU name" htmlFor="sku_name" error={productForm.formState.errors.sku_name?.message}>
            <Input id="sku_name" {...productForm.register("sku_name")} />
          </FormField>
          <FormField label="Product name" htmlFor="product_name" error={productForm.formState.errors.product_name?.message}>
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
            <Input
              id="is_bundling"
              list="product-boolean-options"
              value={String(productForm.watch("is_bundling"))}
              onChange={(e) => productForm.setValue("is_bundling", parseBooleanInput(e.target.value))}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Main inventory" htmlFor="inv_main">
            <Input id="inv_main" list="product-inventory-codes" {...productForm.register("inv_main")} />
          </FormField>
          <FormField label="Accessory inventory" htmlFor="inv_acc">
            <Input id="inv_acc" list="product-inventory-codes" {...productForm.register("inv_acc")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Marketplace price" htmlFor="price_mp" error={productForm.formState.errors.price_mp?.message}>
            <Input id="price_mp" {...productForm.register("price_mp")} />
          </FormField>
          <FormField label="Non-MP price" htmlFor="price_non_mp" error={productForm.formState.errors.price_non_mp?.message}>
            <Input id="price_non_mp" {...productForm.register("price_non_mp")} />
          </FormField>
          <FormField label="Total HPP" htmlFor="total_hpp">
            <Input id="total_hpp" {...productForm.register("total_hpp")} />
          </FormField>
        </div>
        <FormField label="Active" htmlFor="product_active">
          <Input
            id="product_active"
            list="product-boolean-options"
            value={String(productForm.watch("is_active"))}
            onChange={(e) => productForm.setValue("is_active", parseBooleanInput(e.target.value))}
          />
        </FormField>

        <datalist id="product-category-codes">
          {(categories.categoriesQuery.data ?? []).map((category) => (
            <option key={category.category_code} value={category.category_code}>
              {category.category_name}
            </option>
          ))}
        </datalist>
        <datalist id="product-inventory-codes">
          {(inventory.inventoryQuery.data ?? []).map((item) => (
            <option key={item.inv_code} value={item.inv_code}>
              {item.inv_name}
            </option>
          ))}
        </datalist>
        <datalist id="product-boolean-options">
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
