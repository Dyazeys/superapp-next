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
import { useChannelGroups } from "@/features/channel/use-channel-module";
import type { ChannelGroupInput } from "@/schemas/channel-module";
import type { ChannelGroupRecord } from "@/types/channel";

const columnHelper = createColumnHelper<ChannelGroupRecord>();

export default function ChannelGroupsPage() {
  const hooks = useChannelGroups();
  const { groupsQuery, groupForm, groupModal, editingGroup } = hooks;
  const groupRows = groupsQuery.data ?? [];
  const totalGroups = groupRows.length;
  const groupsWithCategories = groupRows.filter((row) => (row._count?.m_channel_category ?? 0) > 0).length;
  const totalCategories = groupRows.reduce((sum, row) => sum + (row._count?.m_channel_category ?? 0), 0);

  const columns = [
    columnHelper.accessor("group_id", {
      header: "ID",
      cell: (info) => <span className="font-medium tabular-nums">{info.getValue()}</span>,
    }),
    columnHelper.accessor("group_name", { header: "Group" }),
    columnHelper.display({
      id: "categories",
      header: "Categories",
      cell: ({ row }) => <span className="tabular-nums">{row.original._count?.m_channel_category ?? 0}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openGroupModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteGroup(row.original.group_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Channel"
      title="Channel Groups"
      description="Kelola struktur grup channel untuk pengelompokan master channel."
    >
      {groupsQuery.isError ? (
        <EmptyState title="Failed to load channel groups" description={groupsQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Total groups" value={String(totalGroups)} subtitle="Jumlah group yang terlihat." />
            <MetricCard title="With categories" value={String(groupsWithCategories)} subtitle="Group yang punya kategori." />
            <MetricCard title="Total categories" value={String(totalCategories)} subtitle="Akumulasi kategori (visible)." />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openGroupModal()}>
              <Plus className="size-4" />
              Add group
            </Button>
          </div>

          <DataTable columns={columns} data={groupsQuery.data ?? []} emptyMessage="No channel groups yet." />
        </div>
      )}

      <ModalFormShell
        open={groupModal.open}
        onOpenChange={groupModal.setOpen}
        title={editingGroup ? "Edit channel group" : "Create channel group"}
        description="Kelola master grup channel tanpa mengubah proses bisnis modul lain."
        isSubmitting={groupForm.formState.isSubmitting}
        onSubmit={() => {
          return groupForm.handleSubmit((values: ChannelGroupInput) => hooks.saveGroup(values))();
        }}
      >
        <FormField label="Group name" htmlFor="group_name" error={groupForm.formState.errors.group_name?.message}>
          <Input id="group_name" {...groupForm.register("group_name")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
