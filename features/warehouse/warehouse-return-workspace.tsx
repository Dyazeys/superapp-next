"use client";

import { useCallback, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Loader2, PackagePlus, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWarehouseReturns } from "@/features/warehouse/use-warehouse-module";
import { toDateInput } from "@/features/warehouse/use-warehouse-module";
import type { WarehouseReturn } from "@/types/warehouse";

const columnHelper = createColumnHelper<WarehouseReturn>();

function statusTone(status: string): "info" | "success" | "warning" | "danger" {
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

function payoutLabel(status: string | null) {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s === "FAILED") return { label: "Payout: FAILED", tone: "danger" as const };
  if (s === "SETTLED") return { label: "Payout: SETTLED", tone: "success" as const };
  return { label: `Payout: ${status}`, tone: "info" as const };
}

export function WarehouseReturnWorkspace({
  returns,
}: {
  returns: WarehouseReturn[];
}) {
  const { returnsQuery, candidatesQuery, createModal, createReturn, postReturnStock } = useWarehouseReturns();
  const [searchQuery, setSearchQuery] = useState("");
  const [postingId, setPostingId] = useState<string | null>(null);

  const [selectedRefNo, setSelectedRefNo] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [verifiedBy, setVerifiedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [creating, setCreating] = useState(false);

  const candidates = useMemo(() => candidatesQuery.data ?? [], [candidatesQuery.data]);
  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.ref_no === selectedRefNo),
    [candidates, selectedRefNo]
  );
  const candidateItems = selectedCandidate?.items ?? [];

  const resetFormState = useCallback(() => {
    setSelectedRefNo(null);
    setReturnDate(new Date().toISOString().slice(0, 10));
    setVerifiedBy("");
    setNotes("");
    setItemQty({});
  }, []);

  const openCreate = useCallback(() => {
    resetFormState();
    createModal.openModal();
  }, [createModal, resetFormState]);

  const selectCandidate = useCallback((refNo: string) => {
    setSelectedRefNo(refNo);
    const candidate = candidates.find((c) => c.ref_no === refNo);
    if (candidate) {
      const initial: Record<string, number> = {};
      for (const item of candidate.items) {
        initial[item.sku] = item.qty;
      }
      setItemQty(initial);
    }
  }, [candidates]);

  const handleCreate = useCallback(async () => {
    if (!selectedRefNo || !verifiedBy.trim()) return;
    setCreating(true);
    try {
      const candidate = candidates.find((c) => c.ref_no === selectedRefNo);
      if (!candidate) return;

      const items = candidate.items
        .filter((item) => (itemQty[item.sku] ?? 0) > 0)
        .map((item) => ({
          sku: item.sku,
          inv_code: item.inv_code,
          qty_returned: itemQty[item.sku] ?? item.qty,
        }));

      await createReturn({
        ref_no: candidate.ref_no,
        return_date: returnDate,
        verified_by: verifiedBy,
        notes: notes || null,
        items,
      });

      resetFormState();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create return");
    } finally {
      setCreating(false);
    }
  }, [selectedRefNo, candidates, itemQty, returnDate, verifiedBy, notes, createReturn, resetFormState]);

  async function handlePostStock(returnId: string) {
    setPostingId(returnId);
    try {
      await postReturnStock(returnId);
      await returnsQuery.refetch?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post stock");
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
        <MetricCard title="Total Returns" value={String(totalReturns)} subtitle="All warehouse returns" />
        <MetricCard title="Pending" value={String(pendingCount)} subtitle="Awaiting verification" />
        <MetricCard title="Received" value={String(receivedCount)} subtitle="Good condition" />
        <MetricCard title="Damaged" value={String(damagedCount)} subtitle="Damaged condition" />
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ref no or order..."
            className="rounded-2xl pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Create Return
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredReturns} emptyMessage="No warehouse returns found." />

      <Dialog open={createModal.open} onOpenChange={(open) => {
        if (open) {
          createModal.openModal();
        } else {
          createModal.closeModal();
          resetFormState();
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Return</DialogTitle></DialogHeader>

          {candidatesQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : candidatesQuery.error ? (
            <p className="text-sm text-rose-600 py-6 text-center">Gagal memuat kandidat return.</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No eligible orders found for return.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Select Order</p>
                <div className="space-y-1 max-h-44 overflow-y-auto border rounded-lg p-1">
                  {candidates.map((c) => {
                    const p = payoutLabel(c.payout_status);
                    return (
                      <button
                        key={c.ref_no}
                        type="button"
                        onClick={() => selectCandidate(c.ref_no)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                          selectedRefNo === c.ref_no
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span className={`size-3 rounded-full border-2 ${selectedRefNo === c.ref_no ? "border-blue-500 bg-blue-500" : "border-slate-300"}`} />
                        <span className="font-medium text-slate-800 w-24">{c.order_no}</span>
                        <StatusBadge label={c.status} tone={c.status === "RETUR" ? "info" : "warning"} />
                        {p && <StatusBadge label={p.label} tone={p.tone} />}
                        <span className="text-slate-400 ml-auto text-xs">{new Date(c.order_date).toLocaleDateString("id-ID")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCandidate && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Return Date</p>
                      <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Verified By</p>
                      <Input value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} placeholder="Name" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Notes</p>
                      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Items</p>
                    <div className="border rounded-lg divide-y text-sm">
                      {candidateItems.map((item) => (
                        <div key={item.sku} className="flex items-center gap-3 px-3 py-2">
                          <span className="text-slate-500 font-mono text-xs w-20">{item.sku}</span>
                          <span className="flex-1 text-slate-700 truncate">{item.product_name}</span>
                          <span className="text-slate-400 text-xs w-16">{item.inv_code}</span>
                          <span className="text-slate-400 text-xs">Ordered: {item.qty}</span>
                          <Input
                            type="number"
                            min={0}
                            max={item.qty}
                            value={itemQty[item.sku] ?? item.qty}
                            onChange={(e) => setItemQty((prev) => ({ ...prev, [item.sku]: Math.max(0, Math.min(item.qty, Number(e.target.value) || 0)) }))}
                            className="w-20 text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => createModal.closeModal()}>Cancel</Button>
                    <Button size="sm" disabled={creating || !verifiedBy.trim()} onClick={handleCreate}>
                      {creating ? <Loader2 className="size-3 animate-spin" /> : null}
                      Create
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
