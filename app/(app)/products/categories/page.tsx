"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { FormField } from "@/components/forms/form-field";
import { MetricCard } from "@/components/layout/stats-card";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  PRODUCT_BOOLEAN_OPTIONS,
  parseBooleanInput,
  useProductCategories,
} from "@/features/product/use-product-module";
import type { ProductCategoryInput } from "@/schemas/product-module";
import type { ProductCategoryRecord } from "@/types/product";

const columnHelper = createColumnHelper<ProductCategoryRecord>();

export default function ProductCategoriesPage() {
  const hooks = useProductCategories();
  const { categoriesQuery, categoryForm, categoryModal, editingCategory } = hooks;
  const categoryRows = categoriesQuery.data ?? [];
  const totalCategories = categoryRows.length;
  const activeCategories = categoryRows.filter((row) => row.is_active).length;
  const rootCategories = categoryRows.filter((row) => !row.parent_category_code).length;
  const childCategories = totalCategories - rootCategories;
  const columns = [
    columnHelper.accessor("category_code", {
      header: "Code",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("category_name", { header: "Name" }),
    columnHelper.accessor("parent_category_code", {
      header: "Parent",
      cell: (info) => info.getValue() ?? "-",
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
        <div className="flex gap-2 justify-end">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openCategoryModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => { if (window.confirm("Hapus kategori ini?")) hooks.deleteCategory(row.original.category_code); }}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Product"
      title="Product Categories"
      description="Kelola kategori untuk menjaga struktur katalog dan pelaporan tetap rapi."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total categories" value={String(totalCategories)} subtitle="Semua kategori yang terlihat." />
          <MetricCard title="Kategori aktif" value={String(activeCategories)} subtitle="Kategori yang dapat digunakan." />
          <MetricCard title="Root categories" value={String(rootCategories)} subtitle="Kategori tanpa parent." />
          <MetricCard title="Child categories" value={String(childCategories)} subtitle="Kategori yang berada di bawah parent." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openCategoryModal()}>
            <Plus className="size-4" />
            Add category
          </Button>
        </div>
        <DataTable columns={columns} data={categoriesQuery.data ?? []} emptyMessage="No categories yet." />
      </div>

      <ModalFormShell
        open={categoryModal.open}
        onOpenChange={categoryModal.setOpen}
        title={editingCategory ? "Edit category" : "Create category"}
        description="Manage product categories"
        isSubmitting={categoryForm.formState.isSubmitting}
        onSubmit={() => {
          return categoryForm.handleSubmit((values: ProductCategoryInput) => hooks.saveCategory(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Code" htmlFor="category_code" error={categoryForm.formState.errors.category_code?.message}>
            <Input id="category_code" {...categoryForm.register("category_code")} disabled={Boolean(editingCategory)} />
          </FormField>
          <FormField label="Parent" htmlFor="parent_category_code">
            <Input id="parent_category_code" {...categoryForm.register("parent_category_code")} />
          </FormField>
        </div>
        <FormField label="Name" htmlFor="category_name" error={categoryForm.formState.errors.category_name?.message}>
          <Input id="category_name" {...categoryForm.register("category_name")} />
        </FormField>
        <FormField label="Active" htmlFor="is_active">
          <SelectNative
            id="is_active"
            value={String(categoryForm.watch("is_active"))}
            onChange={(e) => categoryForm.setValue("is_active", parseBooleanInput(e.target.value))}
          >
            {PRODUCT_BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectNative>
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
