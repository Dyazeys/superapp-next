"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { useSalesChannels } from "@/features/sales/use-sales-module";
import type { ChannelLookupRecord } from "@/types/sales";

const columnHelper = createColumnHelper<ChannelLookupRecord>();

export default function SalesChannelsPage() {
  const channelsQuery = useSalesChannels();
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
  ];

  return (
    <PageShell
      eyebrow="Sales"
      title="Channels"
      description="Lihat master channel penjualan untuk memastikan input transaksi dan pelaporan konsisten."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total channels" value={String(totalChannels)} subtitle="Jumlah channel yang terlihat." />
          <MetricCard title="Marketplace" value={String(marketplaceChannels)} subtitle="Channel marketplace." />
          <MetricCard title="Direct" value={String(directChannels)} subtitle="Channel direct/non-marketplace." />
          <MetricCard title="Has slug" value={String(withSlug)} subtitle="Channel yang memiliki slug." />
        </div>
        <DataTable columns={columns} data={channelsQuery.data ?? []} emptyMessage="No channels found." />
      </div>
    </PageShell>
  );
}
