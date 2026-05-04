"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Check } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTaskKpis } from "@/features/task/use-task-module";
import type { TaskKpi } from "@/types/task";

const columnHelper = createColumnHelper<TaskKpi>();

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

function computeSkor(kpi: TaskKpi): number {
  if (kpi.target_value <= 0 || kpi.realization_value <= 0) return 0;
  if (kpi.type === "minimize") {
    return kpi.target_value / kpi.realization_value;
  }
  return kpi.realization_value / kpi.target_value;
}

function computeSkorAkhir(kpi: TaskKpi): number {
  return (computeSkor(kpi) * kpi.bobot) / 100;
}

export function TaskKpiWorkspace() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "mock";
  const hooks = useTaskKpis(userId);
  const kpis = hooks.kpisQuery.data ?? [];

  const [editKpi, setEditKpi] = useState<TaskKpi | null>(null);
  const [editValue, setEditValue] = useState(0);

  function openRealizationModal(kpi: TaskKpi) {
    setEditValue(kpi.realization_value);
    setEditKpi(kpi);
  }

  async function saveRealization() {
    if (!editKpi) return;
    await hooks.updateRealization(editKpi.id, editValue);
    setEditKpi(null);
  }

  const columns = [
    columnHelper.display({
      id: "kpi",
      header: "KPI",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-slate-500 mt-0.5">{row.original.description}</p>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: "target",
      header: "Target",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.target_value.toLocaleString("id-ID")} {row.original.unit}</span>
      ),
    }),
    columnHelper.display({
      id: "realisasi",
      header: "Realisasi",
      cell: ({ row }) => {
        const kpi = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm tabular-nums ${kpi.approval_status === "approved" ? "text-emerald-600" : ""}`}>
              {kpi.realization_value.toLocaleString("id-ID")} {kpi.unit}
            </span>
            {kpi.approval_status !== "approved" && (
              <Button size="icon-xs" variant="ghost" onClick={() => openRealizationModal(kpi)}>
                <Pencil className="size-3" />
              </Button>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "skor",
      header: "Skor",
      cell: ({ row }) => {
        const skor = computeSkor(row.original);
        return <span className="text-sm tabular-nums">{skor.toFixed(2)}</span>;
      },
    }),
    columnHelper.display({
      id: "skor_akhir",
      header: "Skor Akhir",
      cell: ({ row }) => {
        const skorAkhir = computeSkorAkhir(row.original);
        return <span className="text-sm tabular-nums font-semibold">{skorAkhir.toFixed(2)}</span>;
      },
    }),
    columnHelper.display({
      id: "bobot",
      header: "Bobot",
      cell: ({ row }) => <span className="text-sm">{row.original.bobot}</span>,
    }),
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={approvalColors[row.original.approval_status]}>
          {approvalLabels[row.original.approval_status]}
        </Badge>
      ),
    }),
    columnHelper.accessor("period_start", {
      header: "Periode",
      cell: (info) => (
        <span className="text-xs text-slate-500">{info.row.original.period_start} - {info.row.original.period_end}</span>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Tugas"
      title="KPI Saya"
      description="Target KPI, realisasi, skor, dan status approval."
    >
      <div className="space-y-5">
        <DataTable columns={columns} data={kpis} emptyMessage="Belum ada KPI." pagination={{ enabled: true, pageSize: 15 }} />
      </div>

      <Dialog open={!!editKpi} onOpenChange={(open) => { if (!open) setEditKpi(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Input Realisasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">{editKpi?.title}</p>
            <FormField label={`Target: ${editKpi?.target_value.toLocaleString("id-ID")} ${editKpi?.unit}`} htmlFor="kpi_real_value">
              <Input
                id="kpi_real_value"
                type="number"
                value={editValue}
                onChange={e => setEditValue(Number(e.target.value))}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditKpi(null)}>Batal</Button>
              <Button size="sm" onClick={saveRealization}>
                <Check className="size-4 mr-1" />
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
