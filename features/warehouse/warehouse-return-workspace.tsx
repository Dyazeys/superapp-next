"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Loader2, PackagePlus, Plus, Search } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import type { WarehouseReturn } from "@/types/warehouse";

const columnHelper = createColumnHelper<WarehouseReturn>();

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function statusTone(
  status: string,
): "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "PENDING":
      return "info";
    case "RECEIVED_GOOD":
      return "success";
    case "RECEIVED_DAMAGED":
      return "warning";
    default:
      return "info";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "RECEIVED_GOOD":
      return "RECEIVED ✓";
    case "RECEIVED_DAMAGED":
      return "DAMAGED ⚠";
    default:
      return status;
  }
}

export function WarehouseReturnWorkspace({
  returns,
  onRefresh,
}: {
  returns: WarehouseReturn[];
  onRefresh?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [postingId, setPostingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handlePostStock(returnId: string) {
    setPostingId(returnId);
    setToast(null);
    try {
      const res = await fetch(`/api/warehouse/returns/${returnId}/post-stock`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errData?.message ?? "Failed to post stock");
      }
      const result = await res.json();
      setToast({
        type: "success",
        message: `Posted: ${result.summary.posted} items, skipped: ${result.summary.skipped}`,
      });
      onRefresh?.();
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPostingId(null);
    }
  }

  const filteredReturns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return returns;
    return returns.filter(
      (r) =>
        r.ref_no.toLowerCase().includes(q) ||
        (r.t_order?.order_no?.toLowerCase().includes(q) ?? false),
    );
  }, [returns, searchQuery]);

  const totalReturns = filteredReturns.length;
  const pendingCount = filteredReturns.filter(
    (r) => r.status === "PENDING",
  ).length;
  const receivedCount = filteredReturns.filter(
    (r) => r.status === "RECEIVED_GOOD",
  ).length;
  const damagedCount = filteredReturns.filter(
    (r) => r.status === "RECEIVED_DAMAGED",
  ).length;

  const columns = [
    columnHelper.accessor("ref_no", {
      header: "Ref No",
      cell: (info) => (
        <span className="font-medium text-blue-600">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("t_order.order_no", {
      id: "order_no",
      header: "Order",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("return_date", {
      header: "Return Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <StatusBadge
          label={statusLabel(info.getValue())}
          tone={statusTone(info.getValue())}
        />
      ),
    }),
    columnHelper.accessor("verified_by", {
      header: "Verified By",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("verified_at", {
      header: "Verified At",
      cell: (info) => (info.getValue() ? toDateInput(info.getValue()!) : "-"),
    }),
    columnHelper.accessor("notes", {
      header: "Notes",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const status = row.original.status;
        const rId = row.original.id;
        const isPostable = status === "RECEIVED_GOOD" || status === "RECEIVED_DAMAGED";
        if (!isPostable) return <span className="text-xs text-slate-400">-</span>;
        const isLoading = postingId === rId;
        return (
          <Button
            size="sm"
            variant={status === "RECEIVED_GOOD" ? "default" : "outline"}
            disabled={isLoading}
            onClick={() => handlePostStock(rId)}
            className="whitespace-nowrap text-xs"
          >
            {isLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <PackagePlus className="size-3" />
            )}
            Post Stock
          </Button>
        );
      },
    }),
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Returns"
          value={String(totalReturns)}
          subtitle="All warehouse returns"
        />
        <MetricCard
          title="Pending"
          value={String(pendingCount)}
          subtitle="Awaiting verification"
        />
        <MetricCard
          title="Received"
          value={String(receivedCount)}
          subtitle="Good condition"
        />
        <MetricCard
          title="Damaged"
          value={String(damagedCount)}
          subtitle="Damaged condition"
        />
      </div>

      {toast ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ref no or order..."
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-800 shadow-sm shadow-slate-900/5 outline-none placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-4 focus-visible:ring-slate-200/70"
          />
        </div>
        <div className="flex gap-2">
          {onRefresh ? (
            <Button size="sm" variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          ) : null}
          <Button size="sm">
            <Plus className="size-4" />
            Create Return
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredReturns}
        emptyMessage="No warehouse returns found."
      />
    </div>
  );
}