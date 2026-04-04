"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { useSalesChannels } from "@/features/sales/use-sales-module";
import type { ChannelLookupRecord } from "@/types/sales";

const columnHelper = createColumnHelper<ChannelLookupRecord>();

export default function SalesChannelsPage() {
  const channelsQuery = useSalesChannels();

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
      description="Review sales channel lookup data exposed by the existing sales channel endpoint."
    >
      <DataTable columns={columns} data={channelsQuery.data ?? []} emptyMessage="No channels found." />
    </PageShell>
  );
}
