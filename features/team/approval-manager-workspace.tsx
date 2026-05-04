"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, Eye, RefreshCw, UserRound } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { teamApi } from "@/features/team/api";
import type { ApprovalRequest } from "@/types/task";

const columnHelper = createColumnHelper<ApprovalRequest>();

const typeLabels: Record<string, string> = { leave: "Izin", announcement: "Pengumuman", meeting_note: "Notulen" };

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  leader_approved: "bg-blue-100 text-blue-700",
  manager_acknowledged: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  leader_approved: "Menunggu Manager",
  manager_acknowledged: "Selesai",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function TeamApprovalManagerWorkspace() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "leader_approved" | "manager_acknowledged" | "rejected">("all");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");

  const { data: approvals, isLoading, isError, refetch } = useQuery({
    queryKey: ["approvals", "leader_approved"],
    queryFn: () => teamApi.approvals.list({ status: "leader_approved" }),
  });

  const { data: users } = useQuery({
    queryKey: ["team-users"],
    queryFn: () => teamApi.users.list(),
  });

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users?.users ?? []) {
      map.set(u.id, u.full_name ?? u.username);
    }
    return map;
  }, [users]);

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      teamApi.approvals.acknowledge(id, note),
    onSuccess: () => {
      toast.success("Request telah diketahui");
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setDecisionOpen(false);
      setDecisionNote("");
      setSelectedApproval(null);
    },
    onError: () => {
      toast.error("Gagal mengakui request");
    },
  });

  const filtered = filter === "all" ? (approvals ?? []) : (approvals ?? []).filter(a => a.status === filter);

  function submitAcknowledge() {
    if (!selectedApproval) return;
    acknowledgeMutation.mutate({ id: selectedApproval.id, note: decisionNote || undefined });
  }

  const columns = [
    columnHelper.display({
      id: "requester",
      header: "Pengaju",
      cell: ({ row }) => {
        const name = usersById.get(row.original.requester_id) ?? row.original.requester_id;
        return (
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-slate-400" />
            <span className="text-sm text-slate-900">{name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("type", {
      header: "Jenis",
      cell: (info) => <Badge variant="outline">{typeLabels[info.getValue()]}</Badge>,
    }),
    columnHelper.accessor("title", {
      header: "Request",
      cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor("created_at", {
      header: "Tanggal",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <Badge className={statusColors[info.getValue()]}>{statusLabels[info.getValue()]}</Badge>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const a = row.original;
        if (a.status === "leader_approved" && a.type === "leave") {
          return (
            <div className="flex justify-end gap-1">
              <Button size="icon-xs" variant="outline" onClick={() => { setSelectedApproval(a); setDetailOpen(true); }}><Eye className="size-3.5" /></Button>
              <Button size="icon-xs" variant="outline" className="text-emerald-600 border-emerald-300" onClick={() => { setSelectedApproval(a); setDecisionOpen(true); }}><Check className="size-3.5" /> Ketahui</Button>
            </div>
          );
        }
        return (
          <div className="flex justify-end">
            <Button size="icon-xs" variant="outline" onClick={() => { setSelectedApproval(a); setDetailOpen(true); }}><Eye className="size-3.5" /></Button>
          </div>
        );
      },
    }),
  ];

  const filterTabs = [
    { key: "all" as const, label: "Semua" },
    { key: "leader_approved" as const, label: "Menunggu" },
    { key: "manager_acknowledged" as const, label: "Selesai" },
    { key: "rejected" as const, label: "Ditolak" },
  ];

  return (
    <PageShell eyebrow="Team" title="Approval Manager" description="Ketahui dan akui request yang sudah disetujui leader.">
      <div className="space-y-5">
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(f => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">Memuat...</div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-red-600">
            <span>Gagal memuat data</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="size-3.5 mr-1" /> Muat Ulang</Button>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage="Belum ada request." pagination={{ enabled: true, pageSize: 10 }} />
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Detail Request</DialogTitle></DialogHeader>
          {selectedApproval && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-slate-400" />
                <span className="font-medium">Pengaju:</span>
                <span>{usersById.get(selectedApproval.requester_id) ?? selectedApproval.requester_id}</span>
              </div>
              <p><span className="font-medium">Jenis:</span> {typeLabels[selectedApproval.type]}</p>
              <p><span className="font-medium">Request:</span> {selectedApproval.title}</p>
              <p><span className="font-medium">Status:</span> <Badge className={statusColors[selectedApproval.status]}>{statusLabels[selectedApproval.status]}</Badge></p>
              {selectedApproval.decision_note && <p><span className="font-medium">Catatan:</span> {selectedApproval.decision_note}</p>}
              {selectedApproval.decided_by && (
                <p><span className="font-medium">Diproses oleh:</span> {usersById.get(selectedApproval.decided_by) ?? selectedApproval.decided_by}</p>
              )}
            </div>
          )}
          <DialogFooter showCloseButton><Button onClick={() => setDetailOpen(false)}>Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Ketahui Request</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            {selectedApproval && <>&ldquo;{selectedApproval.title}&rdquo; &mdash; {usersById.get(selectedApproval.requester_id) ?? selectedApproval.requester_id}</>}
          </p>
          <Textarea placeholder="Catatan (opsional)..." value={decisionNote} onChange={e => setDecisionNote(e.target.value)} rows={3} />
          <DialogFooter showCloseButton>
            <Button onClick={submitAcknowledge} disabled={acknowledgeMutation.isPending}>
              {acknowledgeMutation.isPending ? "Memproses..." : "Ya, Saya Ketahui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
