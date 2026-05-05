"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, RefreshCw, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { teamApi } from "@/features/team/api";
import {
  TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  LEADER_APPROVAL_TYPES,
  buildDomainDetail,
  type DomainDetailSection,
} from "@/features/team/approval-constants";
import type { ApprovalRequest, ApprovalType, ApprovalDetail } from "@/types/task";

const columnHelper = createColumnHelper<ApprovalRequest>();

type TypeTab = "workflow" | "leave";
type WorkflowStatusFilter = "all" | "pending" | "approved" | "rejected";
type LeaveStatusFilter = "all" | "pending" | "leader_approved" | "rejected";

const WORKFLOW_STATUS_TABS: { key: WorkflowStatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

const LEAVE_STATUS_TABS: { key: LeaveStatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "leader_approved", label: "Disetujui Leader" },
  { key: "rejected", label: "Ditolak" },
];

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full text-xs font-medium px-3 py-1 cursor-pointer transition-colors select-none",
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );
}

function TypeTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2 px-5 text-sm font-medium transition-all select-none cursor-pointer rounded-md",
        active
          ? "bg-white text-slate-900 shadow-sm font-semibold"
          : "text-slate-400 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function DetailSection({ section }: { section: DomainDetailSection }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{section.title}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {section.fields
          .filter((f) => f.value !== null && f.value !== "")
          .map((field) => (
            <div key={field.label} className="col-span-1">
              <dt className="text-xs text-slate-400">{field.label}</dt>
              <dd className="text-sm font-medium text-slate-900">{String(field.value)}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function DetailDialogContent({ detail, usersById }: { detail: ApprovalDetail; usersById: Map<string, string> }) {
  const sections = buildDomainDetail(detail.type, detail.domainDetail);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Pengaju</p>
            <p className="text-sm font-medium text-slate-900">{usersById.get(detail.requester_id) ?? detail.requester_id}</p>
          </div>
        </div>
        <Badge className={STATUS_COLORS[detail.status] ?? "bg-slate-100 text-slate-700"}>
          {STATUS_LABELS[detail.status] ?? detail.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400">Jenis</p>
          <p className="text-sm font-medium text-slate-900">{TYPE_LABELS[detail.type] ?? detail.type}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Tanggal Buat</p>
          <p className="text-sm font-medium text-slate-900">
            {new Date(detail.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400">Request</p>
        <p className="text-sm font-medium text-slate-900">{detail.title}</p>
      </div>
      {sections.length > 0 && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          {sections.map((section, i) => <DetailSection key={i} section={section} />)}
        </div>
      )}
      {detail.decision_note && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Catatan Keputusan</p>
          <p className="text-sm text-slate-700">{detail.decision_note}</p>
          {detail.decided_by && (
            <p className="text-xs text-slate-400 mt-1">
              Oleh: {usersById.get(detail.decided_by) ?? detail.decided_by}
              {detail.decided_at && ` — ${new Date(detail.decided_at).toLocaleString("id-ID")}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function TeamApprovalLeaderWorkspace() {
  const queryClient = useQueryClient();
  const [typeTab, setTypeTab] = useState<TypeTab>("workflow");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter | LeaveStatusFilter>("all");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ApprovalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const query = useQuery({ queryKey: ["team-approvals"], queryFn: () => teamApi.approvals.list() });
  const usersQuery = useQuery({ queryKey: ["team-users"], queryFn: () => teamApi.users.list() });

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersQuery.data?.users ?? []) {
      map.set(u.id, u.full_name ?? u.username);
    }
    return map;
  }, [usersQuery.data]);

  const filtered = useMemo(() => {
    const allData = query.data ?? [];
    let list: ApprovalRequest[];

    if (typeTab === "workflow") {
      list = allData.filter((a) => LEADER_APPROVAL_TYPES.includes(a.type as ApprovalType));
      if (statusFilter !== "all") {
        list = list.filter((a) => a.status === statusFilter);
      }
    } else {
      list = allData.filter((a) => a.type === "leave");
      if (statusFilter !== "all") {
        list = list.filter((a) => a.status === statusFilter);
      }
    }
    return list;
  }, [query.data, typeTab, statusFilter]);

  const isPendingWorkflow = (a: ApprovalRequest) =>
    a.status === "pending" && LEADER_APPROVAL_TYPES.includes(a.type as ApprovalType);

  const isPendingLeave = (a: ApprovalRequest) =>
    a.status === "pending" && a.type === "leave";

  const openDetail = async (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setDetailOpen(true);
    setDetailData(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const data = await teamApi.approvals.detail(approval.id);
      setDetailData(data);
    } catch {
      setDetailError("Gagal memuat detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => teamApi.approvals.approve(id, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      setDecisionOpen(false);
      setDecisionNote("");
      setSelectedApproval(null);
      setActionType(null);
      toast.success("Request berhasil disetujui & diposting");
    },
    onError: (err: Error) => toast.error(err.message || "Gagal menyetujui request"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => teamApi.approvals.reject(id, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      setDecisionOpen(false);
      setDecisionNote("");
      setSelectedApproval(null);
      setActionType(null);
      toast.success("Request berhasil ditolak");
    },
    onError: (err: Error) => toast.error(err.message || "Gagal menolak request"),
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
            <UserRound className="size-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-900 truncate">{name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("type", {
      header: "Jenis",
      cell: (info) => <Badge variant="outline">{TYPE_LABELS[info.getValue()] ?? info.getValue()}</Badge>,
    }),
    columnHelper.accessor("title", {
      header: "Request",
      cell: (info) => <span className="text-sm text-slate-900 line-clamp-1">{info.getValue()}</span>,
    }),
    columnHelper.accessor("created_at", {
      header: "Tanggal",
      cell: (info) =>
        new Date(info.getValue()).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge className={STATUS_COLORS[info.getValue()] ?? "bg-slate-100 text-slate-700"}>
          {STATUS_LABELS[info.getValue()]}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const a = row.original;
        const canActWorkflow = isPendingWorkflow(a);
        const canActLeave = isPendingLeave(a);
        if (canActWorkflow || canActLeave) {
          return (
            <div className="flex items-center gap-1.5 justify-end">
              <Button size="sm" variant="outline" onClick={() => openDetail(a)} className="gap-1.5">
                <Eye className="size-3.5" /> Detail
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => { setSelectedApproval(a); setActionType("approve"); setDecisionOpen(true); }}
              >
                <Check className="size-3.5" /> Setujui
              </Button>
              <Button
                size="sm"
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
            <Button size="sm" variant="outline" onClick={() => openDetail(a)} className="gap-1.5">
              <Eye className="size-3.5" /> Detail
            </Button>
          </div>
        );
      },
    }),
  ];

  const currentStatusTabs = typeTab === "workflow" ? WORKFLOW_STATUS_TABS : LEAVE_STATUS_TABS;

  return (
    <PageShell eyebrow="Team" title="Approval Leader" description="Setujui atau tolak request warehouse & sales.">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center rounded-lg bg-slate-800 p-1 gap-1">
            <TypeTabButton
              active={typeTab === "workflow"}
              label="Warehouse"
              onClick={() => { setTypeTab("workflow"); setStatusFilter("all"); }}
            />
            <TypeTabButton
              active={typeTab === "leave"}
              label="Izin"
              onClick={() => { setTypeTab("leave"); setStatusFilter("all"); }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {currentStatusTabs.map((f) => (
              <Pill
                key={f.key}
                active={statusFilter === f.key}
                label={f.label}
                onClick={() => setStatusFilter(f.key as WorkflowStatusFilter | LeaveStatusFilter)}
              />
            ))}
          </div>
        </div>

        {query.isPending ? (
          <EmptyState title="Memuat..." description="Mohon tunggu sebentar." />
        ) : query.isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-red-600">
            <span>Gagal memuat data</span>
            <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw className="size-3.5 mr-1" /> Muat Ulang
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage="Belum ada request." pagination={{ enabled: true, pageSize: 10 }} />
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detail Request</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-500">Memuat detail...</div>
          ) : detailError ? (
            <div className="text-sm text-red-600 py-4 text-center">{detailError}</div>
          ) : detailData && selectedApproval ? (
            <DetailDialogContent detail={detailData} usersById={usersById} />
          ) : null}
          <DialogFooter showCloseButton>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Setujui" : "Tolak"} Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {selectedApproval && (
              <>&ldquo;{selectedApproval.title}&rdquo; — {TYPE_LABELS[selectedApproval.type] ?? selectedApproval.type}</>
            )}
          </p>
          {selectedApproval && isPendingWorkflow(selectedApproval) && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
              Menyetujui akan langsung memposting &mdash; data tidak bisa diedit setelah diposting.
            </p>
          )}
          {selectedApproval && isPendingLeave(selectedApproval) && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-3">
              Menyetujui berarti izin disetujui oleh Leader. Manager akan tetap perlu acknowledge.
            </p>
          )}
          <Textarea placeholder="Catatan keputusan (opsional)..." value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} rows={3} />
          <DialogFooter showCloseButton>
            <Button variant={actionType === "reject" ? "destructive" : "default"} onClick={submitDecision} disabled={isDecisionPending}>
              {actionType === "approve" ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}