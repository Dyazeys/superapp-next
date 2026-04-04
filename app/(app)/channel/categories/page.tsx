"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseOptionalInt, useChannelCategories, useChannelGroupsLookup } from "@/features/channel/use-channel-module";
import type { ChannelCategoryInput } from "@/schemas/channel-module";
import type { ChannelCategoryRecord } from "@/types/channel";

const columnHelper = createColumnHelper<ChannelCategoryRecord>();

export default function ChannelCategoriesPage() {
  const hooks = useChannelCategories();
  const groupsQuery = useChannelGroupsLookup();
  const { categoriesQuery, categoryForm, categoryModal, editingCategory } = hooks;
  const categoryRows = categoriesQuery.data ?? [];
  const totalCategories = categoryRows.length;
  const withGroup = categoryRows.filter((row) => row.group_id !== null).length;
  const ungrouped = totalCategories - withGroup;
  const totalChannels = categoryRows.reduce((sum, row) => sum + (row._count?.m_channel ?? 0), 0);

  const columns = [
    columnHelper.accessor("category_id", {
      header: "ID",
      cell: (info) => <span className="font-medium tabular-nums">{info.getValue()}</span>,
    }),
    columnHelper.accessor("category_name", { header: "Category" }),
    columnHelper.display({
      id: "group",
      header: "Group",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <p className="font-medium">{row.original.m_channel_group?.group_name ?? "-"}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {row.original.group_id ? `ID ${row.original.group_id}` : "No group"}
          </p>
        </div>
      ),
    }),
    columnHelper.display({
      id: "channels",
      header: "Channels",
      cell: ({ row }) => <span className="tabular-nums">{row.original._count?.m_channel ?? 0}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openCategoryModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteCategory(row.original.category_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Channel"
      title="Channel Categories"
      description="Kelola kategori channel untuk konsistensi segmentasi channel."
    >
      {categoriesQuery.isError ? (
        <EmptyState title="Failed to load channel categories" description={categoriesQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Total categories" value={String(totalCategories)} subtitle="Jumlah kategori yang terlihat." />
            <MetricCard title="With group" value={String(withGroup)} subtitle="Kategori yang terhubung group." />
            <MetricCard title="Ungrouped" value={String(ungrouped)} subtitle="Kategori tanpa group." />
            <MetricCard title="Channels" value={String(totalChannels)} subtitle="Akumulasi channel (visible)." />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openCategoryModal()}>
              <Plus className="size-4" />
              Add category
            </Button>
          </div>

          <DataTable columns={columns} data={categoriesQuery.data ?? []} emptyMessage="No channel categories yet." />
        </div>
      )}

      <ModalFormShell
        open={categoryModal.open}
        onOpenChange={categoryModal.setOpen}
        title={editingCategory ? "Edit channel category" : "Create channel category"}
        description="Kelola master kategori channel tanpa mengubah proses bisnis modul lain."
        isSubmitting={categoryForm.formState.isSubmitting}
        onSubmit={() => {
          return categoryForm.handleSubmit((values: ChannelCategoryInput) => hooks.saveCategory(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Group ID"
            htmlFor="channel_category_group_id"
            error={categoryForm.formState.errors.group_id?.message}
          >
            <Input
              id="channel_category_group_id"
              list="channel-group-ids"
              value={String(categoryForm.watch("group_id") ?? "")}
              onChange={(event) => categoryForm.setValue("group_id", parseOptionalInt(event.target.value))}
            />
          </FormField>
          <FormField
            label="Category name"
            htmlFor="category_name"
            error={categoryForm.formState.errors.category_name?.message}
          >
            <Input id="category_name" {...categoryForm.register("category_name")} />
          </FormField>
        </div>

        <datalist id="channel-group-ids">
          {(groupsQuery.data ?? []).map((group) => (
            <option key={group.group_id} value={group.group_id}>
              {group.group_name}
            </option>
          ))}
        </datalist>
      </ModalFormShell>
    </PageShell>
  );
}
