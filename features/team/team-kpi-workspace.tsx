"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";
import { Badge } from "@/components/ui/badge";
import { useTeamKpis, useUsers } from "@/features/task/use-task-module";
import { taskApi } from "@/features/task/api";
import type { TaskKpi, UserBrief, KpiType } from "@/types/task";

const userColumnHelper = createColumnHelper<UserBrief>();

const approvalColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const approvalLabels: Record<string, string> = {
  draft: "Draft",
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function TeamKpiWorkspace() {
  const queryClient = useQueryClient();
  const hooks = useTeamKpis();
  const usersQuery = useUsers();
  const users = usersQuery.data ?? [];
  const kpis = hooks.kpisQuery.data ?? [];

  const [manageUser, setManageUser] = useState<UserBrief | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<TaskKpi | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<KpiType>("maximize");
  const [formBobot, setFormBobot] = useState(1);
  const [formTarget, setFormTarget] = useState(0);
  const [formUnit, setFormUnit] = useState("");
  const [formPeriodStart, setFormPeriodStart] = useState("");
  const [formPeriodEnd, setFormPeriodEnd] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [deletingKpi, setDeletingKpi] = useState<TaskKpi | null>(null);

  const userKpis = manageUser ? kpis.filter(k => k.user_id === manageUser.id) : [];
  const userBobotTotal = userKpis.reduce((sum, k) => sum + k.bobot, 0);

  function openAddForm() {
    setEditingKpi(null);
    setFormTitle("");
    setFormDesc("");
    setFormType("maximize");
    setFormBobot(1);
    setFormTarget(0);
    setFormUnit("");
    setFormPeriodStart("2026-05-01");
    setFormPeriodEnd("2026-05-31");
    setFormNotes("");
    setFormOpen(true);
  }

  function openEditForm(kpi: TaskKpi) {
    setEditingKpi(kpi);
    setFormTitle(kpi.title);
    setFormDesc(kpi.description ?? "");
    setFormType(kpi.type);
    setFormBobot(kpi.bobot);
    setFormTarget(kpi.target_value);
    setFormUnit(kpi.unit);
    setFormPeriodStart(kpi.period_start);
    setFormPeriodEnd(kpi.period_end);
    setFormNotes(kpi.notes ?? "");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingKpi(null);
  }

  async function saveForm() {
    if (!formTitle.trim() || !manageUser) return;
    setFormSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDesc || null,
        type: formType,
        bobot: formBobot,
        target_value: formTarget,
        unit: formUnit,
        period_start: formPeriodStart,
        period_end: formPeriodEnd,
        notes: formNotes || null,
      };
      if (editingKpi) {
        await taskApi.kpis.update(editingKpi.id, payload);
        toast.success("KPI diupdate");
      } else {
        await taskApi.kpis.create({ ...payload, user_id: manageUser.id });
        toast.success("KPI ditambahkan");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-kpis"] }),
        queryClient.invalidateQueries({ queryKey: ["task-kpis"] }),
      ]);
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setFormSaving(false);
    }
  }

  async function confirmDeleteKpi() {
    if (!deletingKpi) return;
    try {
      await taskApi.kpis.remove(deletingKpi.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-kpis"] }),
        queryClient.invalidateQueries({ queryKey: ["task-kpis"] }),
      ]);
      toast.success("KPI dihapus");
      setDeletingKpi(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    }
  }

  async function approveKpi(id: string) {
    try {
      await taskApi.kpis.approve(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-kpis"] }),
        queryClient.invalidateQueries({ queryKey: ["task-kpis"] }),
      ]);
      toast.success("KPI disetujui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal approve");
    }
  }

  async function rejectKpi(id: string) {
    try {
      await taskApi.kpis.reject(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-kpis"] }),
        queryClient.invalidateQueries({ queryKey: ["task-kpis"] }),
      ]);
      toast.success("KPI ditolak");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal reject");
    }
  }

  const userKpiCounts = new Map<string, number>();
  kpis.forEach(k => userKpiCounts.set(k.user_id, (userKpiCounts.get(k.user_id) ?? 0) + 1));

  const userColumns = [
    userColumnHelper.display({
      id: "name",
      header: "User",
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.full_name}</span>,
    }),
    userColumnHelper.display({
      id: "count",
      header: "Jumlah KPI",
      cell: ({ row }) => {
        const count = userKpiCounts.get(row.original.id) ?? 0;
        return <Badge className="bg-slate-100 text-slate-700">{count}</Badge>;
      },
    }),
    userColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setManageUser(row.original)}>
            <Pencil className="size-3.5 mr-1" />
            Kelola
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Tim"
      title="KPI Tim"
      description="Atur target KPI, bobot, dan approval realisasi per anggota tim."
    >
      <div className="space-y-5">
        <DataTable columns={userColumns} data={users} emptyMessage="Tidak ada user." pagination={{ enabled: true, pageSize: 15 }} />
      </div>

      <Dialog
        open={!!manageUser}
        onOpenChange={(open) => { if (!open) { setManageUser(null); closeForm(); } }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola KPI: {manageUser?.full_name}</DialogTitle>
            <DialogDescription>
              Total bobot: {userBobotTotal}/100
              {userBobotTotal !== 100 && userKpis.length > 0 && (
                <span className="text-amber-600 ml-2">(bobot harus tepat 100)</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formOpen && (
              <div className="rounded-xl border border-border/60 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{editingKpi ? "Edit KPI" : "Tambah KPI Baru"}</span>
                  <Button size="icon-xs" variant="ghost" onClick={closeForm}><X className="size-3.5" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Judul" htmlFor="kpi_title">
                    <Input id="kpi_title" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Nama KPI..." />
                  </FormField>
                  <FormField label="Jenis" htmlFor="kpi_type" helperText="Maximize = makin tinggi makin baik. Minimize = sebaliknya.">
                    <SelectNative id="kpi_type" value={formType} onChange={(e) => setFormType(e.target.value as KpiType)}>
                      <option value="maximize">Maximize</option>
                      <option value="minimize">Minimize</option>
                    </SelectNative>
                  </FormField>
                </div>
                <FormField label="Deskripsi" htmlFor="kpi_desc">
                  <Input id="kpi_desc" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Deskripsi target..." />
                </FormField>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Bobot" htmlFor="kpi_bobot" error={userBobotTotal + (editingKpi ? formBobot - editingKpi.bobot : formBobot) > 100 ? "Total bobot melebihi 100" : undefined}>
                    <Input id="kpi_bobot" type="number" value={formBobot} onChange={e => setFormBobot(Number(e.target.value))} />
                  </FormField>
                  <FormField label="Target" htmlFor="kpi_target">
                    <Input id="kpi_target" type="number" value={formTarget} onChange={e => setFormTarget(Number(e.target.value))} />
                  </FormField>
                  <FormField label="Satuan" htmlFor="kpi_unit">
                    <Input id="kpi_unit" value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="%, unit" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Periode Awal" htmlFor="kpi_ps">
                    <Input id="kpi_ps" type="date" value={formPeriodStart} onChange={e => setFormPeriodStart(e.target.value)} />
                  </FormField>
                  <FormField label="Periode Akhir" htmlFor="kpi_pe">
                    <Input id="kpi_pe" type="date" value={formPeriodEnd} onChange={e => setFormPeriodEnd(e.target.value)} />
                  </FormField>
                </div>
                <FormField label="Catatan" htmlFor="kpi_notes" helperText="Opsional.">
                  <Textarea id="kpi_notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
                </FormField>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={closeForm}>Batal</Button>
                  <Button size="sm" onClick={saveForm} disabled={formSaving || !formTitle.trim() || !formTarget || !formUnit || !formPeriodStart || !formPeriodEnd}>
                    {formSaving ? "Menyimpan..." : editingKpi ? "Simpan" : "Tambah"}
                  </Button>
                </div>
              </div>
            )}

            {!formOpen && (
              <Button size="sm" onClick={openAddForm}>
                <Plus className="size-4" />
                Tambah KPI
              </Button>
            )}

            {userKpis.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Belum ada KPI untuk user ini.</p>
            ) : (
              <div className="space-y-2">
                {userKpis.map(kpi => (
                  <div key={kpi.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{kpi.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="bg-slate-100 text-slate-600 text-xs">{kpi.type === "maximize" ? "Max" : "Min"}</Badge>
                        <span className="text-xs text-slate-500">Bobot: {kpi.bobot}</span>
                        <span className="text-xs text-slate-500">Target: {kpi.target_value.toLocaleString("id-ID")} {kpi.unit}</span>
                        <span className="text-xs text-slate-500">Realisasi: {kpi.realization_value.toLocaleString("id-ID")}</span>
                        <Badge className={approvalColors[kpi.approval_status]}>{approvalLabels[kpi.approval_status]}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {kpi.approval_status === "pending" && (
                        <>
                          <Button size="icon-xs" variant="ghost" className="text-emerald-600" onClick={() => approveKpi(kpi.id)}>
                            <Check className="size-3.5" />
                          </Button>
                          <Button size="icon-xs" variant="ghost" className="text-red-600" onClick={() => rejectKpi(kpi.id)}>
                            <X className="size-3.5" />
                          </Button>
                        </>
                      )}
                      <Button size="icon-xs" variant="ghost" onClick={() => openEditForm(kpi)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setDeletingKpi(kpi)}>
                        <Trash2 className="size-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingKpi} onOpenChange={(open) => { if (!open) setDeletingKpi(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus KPI</DialogTitle>
            <DialogDescription>Hapus KPI &quot;{deletingKpi?.title}&quot;? Tindakan ini permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingKpi(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDeleteKpi}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
