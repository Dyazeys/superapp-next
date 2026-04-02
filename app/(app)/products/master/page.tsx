import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { FormField } from "@/components/forms/form-field";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { useProductCategories, useProductInventory, useProductMaster } from "@/features/product/use-product-module";
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
      cell: (info) =>
        categories.categoriesQuery.data?.find((category) => category.category_code === info.getValue())?.category_name ??
        info.getValue() ??
        "-",
    }),
    columnHelper.accessor("inv_main", {
      header: "Main Inventory",
      cell: (info) =>
        inventory.inventoryQuery.data?.find((inv) => inv.inv_code === info.getValue())?.inv_name ?? info.getValue() ?? "-",
    }),
    columnHelper.accessor("price_mp", { header: "MP Price" }),
    columnHelper.accessor("total_hpp", { header: "Total HPP" }),
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
    <PageShell eyebrow="Product" title="Master Products" description="Manage master SKUs with modal CRUD">
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => openProductModal()}>
          <Plus className="size-4" />
          Add product
        </Button>
      </div>
      <DataTable columns={columns} data={productsQuery.data ?? []} emptyMessage="No master products yet." />

      <ModalFormShell
        open={productModal.open}
        onOpenChange={productModal.setOpen}
        title={editingProduct ? "Edit product" : "Create product"}
        description="Modal CRUD for master products."
        onSubmit={productForm.handleSubmit((values) => hooks.saveProduct(values))}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="SKU" htmlFor="sku" error={productForm.formState.errors.sku?.message}>
            <Input id="sku" {...productForm.register("sku")} disabled={Boolean(editingProduct)} />
          </FormField>
          <FormField label="Category" htmlFor="category_code">
            <Input id="category_code" list="product-category-codes" {...productForm.register("category_code")} />
            <datalist id="product-category-codes">
              {(categories.categoriesQuery.data ?? []).map((category) => (
                <option key={category.category_code} value={category.category_code}>
                  {category.category_name}
                </option>
              ))}
            </datalist>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Product name" htmlFor="product_name" error={productForm.formState.errors.product_name?.message}>
            <Input id="product_name" {...productForm.register("product_name")} />
          </FormField>
          <FormField label="SKU name" htmlFor="sku_name" error={productForm.formState.errors.sku_name?.message}>
            <Input id="sku_name" {...productForm.register("sku_name")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Main inventory" htmlFor="inv_main">
            <Input id="inv_main" list="product-inventory-codes" {...productForm.register("inv_main")} />
            <datalist id="product-inventory-codes">
              {(inventory.inventoryQuery.data ?? []).map((inv) => (
                <option key={inv.inv_code} value={inv.inv_code}>
                  {inv.inv_name}
                </option>
              ))}
            </datalist>
          </FormField>
          <FormField label="Accessory inventory" htmlFor="inv_acc">
            <Input id="inv_acc" list="product-inventory-codes" {...productForm.register("inv_acc")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="MP price" htmlFor="price_mp" error={productForm.formState.errors.price_mp?.message}>
            <Input id="price_mp" {...productForm.register("price_mp")} />
          </FormField>
          <FormField label="Non-MP price" htmlFor="price_non_mp" error={productForm.formState.errors.price_non_mp?.message}>
            <Input id="price_non_mp" {...productForm.register("price_non_mp")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Total HPP" htmlFor="total_hpp">
            <Input id="total_hpp" {...productForm.register("total_hpp")} />
          </FormField>
          <FormField label="Active" htmlFor="is_active">
            <Input
              id="is_active"
              list="boolean-options"
              value={String(productForm.watch("is_active"))}
              onChange={(e) => productForm.setValue("is_active", e.target.value === "true")}
            />
            <datalist id="boolean-options">
              <option value="true">true</option>
              <option value="false">false</option>
            </datalist>
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
