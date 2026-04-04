"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CHANNEL_BOOLEAN_OPTIONS,
  parseChannelBooleanInput,
  parseOptionalInt,
  useChannelCategoriesLookup,
  useChannels,
} from "@/features/channel/use-channel-module";
import type { ChannelInput } from "@/schemas/channel-module";
import type { ChannelRecord } from "@/types/channel";

const columnHelper = createColumnHelper<ChannelRecord>();

export default function ChannelChannelsPage() {
  const hooks = useChannels();
  const categoriesQuery = useChannelCategoriesLookup();
  const { channelsQuery, channelForm, channelModal, editingChannel } = hooks;
  const channelRows = channelsQuery.data ?? [];
  const totalChannels = channelRows.length;
  const marketplaceChannels = channelRows.filter((row) => row.is_marketplace).length;
  const directChannels = totalChannels - marketplaceChannels;
  const withSlug = channelRows.filter((row) => Boolean(row.slug)).length;

  const columns = [
    columnHelper.accessor("channel_id", {
      header: "Channel ID",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("channel_name", { header: "Channel" }),
    columnHelper.display({
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="font-medium">{row.original.m_channel_category?.category_name ?? "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.m_channel_category?.m_channel_group?.group_name ?? "No group"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("slug", {
      header: "Slug",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("is_marketplace", {
      header: "Type",
      cell: (info) => (
        <StatusBadge label={info.getValue() ? "Marketplace" : "Direct"} tone={info.getValue() ? "info" : "neutral"} />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openChannelModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteChannel(row.original.channel_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Channel"
      title="Channels"
      description="Lihat master channel untuk memastikan struktur referensi transaksi tetap konsisten."
    >
      {channelsQuery.isError ? (
        <EmptyState title="Failed to load channels" description={channelsQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Total channels" value={String(totalChannels)} subtitle="Jumlah channel yang terlihat." />
            <MetricCard title="Marketplace" value={String(marketplaceChannels)} subtitle="Channel marketplace." />
            <MetricCard title="Direct" value={String(directChannels)} subtitle="Channel direct/non-marketplace." />
            <MetricCard title="Has slug" value={String(withSlug)} subtitle="Channel yang memiliki slug." />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openChannelModal()}>
              <Plus className="size-4" />
              Add channel
            </Button>
          </div>

          <DataTable columns={columns} data={channelsQuery.data ?? []} emptyMessage="No channels found." />
        </div>
      )}

      <ModalFormShell
        open={channelModal.open}
        onOpenChange={channelModal.setOpen}
        title={editingChannel ? "Edit channel" : "Create channel"}
        description="Kelola master channel sebagai referensi transaksi."
        isSubmitting={channelForm.formState.isSubmitting}
        onSubmit={() => {
          return channelForm.handleSubmit((values: ChannelInput) => hooks.saveChannel(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Channel name" htmlFor="channel_name" error={channelForm.formState.errors.channel_name?.message}>
            <Input id="channel_name" {...channelForm.register("channel_name")} />
          </FormField>
          <FormField label="Slug" htmlFor="channel_slug" error={channelForm.formState.errors.slug?.message}>
            <Input id="channel_slug" {...channelForm.register("slug")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Category ID" htmlFor="channel_category_id" error={channelForm.formState.errors.category_id?.message}>
            <Input
              id="channel_category_id"
              list="channel-category-ids"
              value={String(channelForm.watch("category_id") ?? "")}
              onChange={(event) => channelForm.setValue("category_id", parseOptionalInt(event.target.value))}
            />
          </FormField>
          <FormField label="Marketplace" htmlFor="channel_is_marketplace">
            <Input
              id="channel_is_marketplace"
              list="channel-boolean-options"
              value={String(channelForm.watch("is_marketplace"))}
              onChange={(event) => channelForm.setValue("is_marketplace", parseChannelBooleanInput(event.target.value))}
            />
          </FormField>
        </div>

        <datalist id="channel-category-ids">
          {(categoriesQuery.data ?? []).map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
        </datalist>
        <datalist id="channel-boolean-options">
          {CHANNEL_BOOLEAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>
      </ModalFormShell>
    </PageShell>
  );
}
