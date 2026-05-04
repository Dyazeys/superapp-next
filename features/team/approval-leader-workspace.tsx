"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ClipboardList, Eye, UserRound, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { teamApi } from "@/features/team/api";
import type { ApprovalRequest } from "@/types/task";

const columnHelper = createColumnHelper<ApprovalRequest>();

const typeLabels: Record<string, string> = {
  leave: "Izin",
  announcement: "Pengumuman",
  meeting_note: "Notulen",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  leader_approved: "bg-blue-100 text-blue-700",
  manager_acknowledged: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  leader_approved: "Disetujui Leader",
  manager_acknowledged: "Selesai",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function TeamApprovalLeaderWorkspace() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "leader_approved" | "rejected">("all");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const query = useQuery({
    queryKey: ["team-approvals"],
    queryFn: () => teamApi.approvals.list(),
  });

  const usersQuery = useQuery({
    queryKey: ["team-users-list"],
    queryFn: () => teamApi.users.list(),
  });

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    const usersData = usersQuery.data;
    if (usersData) {
      const users = "users" in usersData ? (usersData as { users: Array<{ id: string; full_name: string | null }> }).users : [];
      for (const u of users) {
        map.set(u.id, u.full_name ?? u.id);
      }
    }
    return map;
  }, [usersQuery.data]);

  const filtered =
    filter === "all" ? (query.data ?? []) : (query.data ?? []).filter((a) => a.status === filter);

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      teamApi.approvals.approve(id, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      setDecisionOpen(false);
      setDecisionNote("");
      setSelectedApproval(null);
      setActionType(null);
      toast.success("Request berhasil disetujui");
    },
    onError: () => toast.error("Gagal menyetujui request"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      teamApi.approvals.reject(id, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      setDecisionOpen(false);
      setDecisionNote("");
      setSelectedApproval(null);
      setActionType(null);
      toast.success("Request berhasil ditolak");
    },
    onError: () => toast.error("Gagal menolak request"),
  });

  function submitDecision() {
    if (!selectedApproval || !actionType) return;
    if (actionType === "approve") {
      approveMutation.mutate({ id: selectedApproval.id, note: decisionNote });
    } else {
      rejectMutation.mutate({ id: selectedApproval.id, note: decisionNote });
    }
  }

  const isDecisionPending = approveMutation.isPending || rejectMutation.isPending;

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
        if (a.status === "pending") {
          return (
            <div className="flex justify-end gap-1">
              <Button size="icon-xs" variant="outline" onClick={() => { setSelectedApproval(a); setDetailOpen(true); }}>
                <Eye className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => { setSelectedApproval(a); setActionType("approve"); setDecisionOpen(true); }}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="destructive"
                onClick={() => { setSelectedApproval(a); setActionType("reject"); setDecisionOpen(true); }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          );
        }
        return (
          <div className="flex justify-end">
            <Button size="icon-xs" variant="outline" onClick={() => { setSelectedApproval(a); setDetailOpen(true); }}>
              <Eye className="size-3.5" />
            </Button>
          </div>
        );
      },
    }),
  ];

  const filterTabs = [
    { key: "all" as const, label: "Semua" },
    { key: "pending" as const, label: "Menunggu" },
    { key: "leader_approved" as const, label: "Disetujui" },
    { key: "rejected" as const, label: "Ditolak" },
  ];

  return (
    <PageShell eyebrow="Team" title="Approval Leader" description="Setujui atau tolak request yang masuk.">
      <div className="space-y-5">
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
        {query.isLoading ? (
          <EmptyState title="Memuat..." description="Mohon tunggu sebentar." />
        ) : query.isError ? (
          <EmptyState title="Gagal memuat" description="Terjadi kesalahan saat memuat data." />
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
              <p>
                <span className="font-medium">Status:</span>{" "}
                <Badge className={statusColors[selectedApproval.status]}>{statusLabels[selectedApproval.status]}</Badge>
              </p>
              {selectedApproval.decision_note && (
                <p><span className="font-medium">Catatan:</span> {selectedApproval.decision_note}</p>
              )}
              {selectedApproval.decided_by && (
                <p>
                  <span className="font-medium">Diproses oleh:</span>{" "}
                  {usersById.get(selectedApproval.decided_by) ?? selectedApproval.decided_by}
                </p>
              )}
            </div>
          )}
          <DialogFooter showCloseButton><Button onClick={() => setDetailOpen(false)}>Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{actionType === "approve" ? "Setujui" : "Tolak"} Request</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            {selectedApproval && (
              <>&ldquo;{selectedApproval.title}&rdquo; &mdash; {usersById.get(selectedApproval.requester_id) ?? selectedApproval.requester_id}</>
            )}
          </p>
          <Textarea
            placeholder="Catatan keputusan (opsional)..."
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            rows={3}
          />
          <DialogFooter showCloseButton>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={submitDecision}
              disabled={isDecisionPending}
            >
              {actionType === "approve" ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
