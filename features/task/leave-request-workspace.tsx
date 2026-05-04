"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useWatch } from "react-hook-form";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTaskLeaveRequests } from "@/features/task/use-task-module";
import type { TaskLeaveRequest, LeaveType, LeaveCategory, LeaveStatus } from "@/types/task";

const columnHelper = createColumnHelper<TaskLeaveRequest>();

const typeLabels: Record<LeaveType, string> = {
  izin_direncanakan: "Izin Direncanakan",
  izin_mendesak: "Izin Mendesak",
};

const typeColors: Record<LeaveType, string> = {
  izin_direncanakan: "bg-blue-100 text-blue-700",
  izin_mendesak: "bg-red-100 text-red-700",
};

const categoryLabels: Record<LeaveCategory, string> = {
  tidak_masuk: "Tidak Masuk",
  datang_terlambat: "Datang Terlambat",
  pulang_cepat: "Pulang Cepat",
};

const statusColors: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  leader_approved: "bg-blue-100 text-blue-700",
  manager_acknowledged: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<LeaveStatus, string> = {
  pending: "Menunggu",
  leader_approved: "Disetujui Leader",
  manager_acknowledged: "Selesai",
  rejected: "Ditolak",
};

export function TaskLeaveRequestWorkspace() {
  const hooks = useTaskLeaveRequests();
  const leaves = hooks.leaveQuery.data ?? [];

  const watchedCategory = useWatch({ control: hooks.leaveForm.control, name: "category" });

  const columns = [
    columnHelper.accessor("application_date", {
      header: "Pengajuan",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("type", {
      header: "Izin",
      cell: (info) => <Badge className={typeColors[info.getValue()]}>{typeLabels[info.getValue()]}</Badge>,
    }),
    columnHelper.accessor("category", {
      header: "Jenis",
      cell: (info) => categoryLabels[info.getValue()],
    }),
    columnHelper.display({
      id: "detail",
      header: "Detail",
      cell: ({ row }) => {
        const l = row.original;
        if (l.category === "tidak_masuk") return <span>{l.start_date} - {l.end_date} ({l.total_days} hari)</span>;
        return <span>{l.start_date} jam {l.time_value}</span>;
      },
    }),
    columnHelper.accessor("reason", {
      header: "Alasan",
      cell: (info) => <span className="line-clamp-1">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge className={statusColors[info.getValue()]}>
          {statusLabels[info.getValue()]}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        row.original.status === "pending" ? (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => hooks.openLeaveModal(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="destructive" onClick={() => hooks.openLeaveDeleteModal(row.original)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ) : null
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Absensi"
      title="Izin / Sakit"
      description="Ajukan izin. Setiap pengajuan akan masuk ke approval leader dan manager."
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openLeaveModal()}>
            <Plus className="size-4" />
            Ajukan Izin
          </Button>
        </div>
        <DataTable columns={columns} data={leaves} emptyMessage="Belum ada pengajuan." pagination={{ enabled: true, pageSize: 10 }} />
      </div>

      <ModalFormShell
        open={hooks.leaveModal.open}
        onOpenChange={hooks.leaveModal.setOpen}
        title={hooks.editingLeave ? "Edit Pengajuan" : "Ajukan Izin"}
        description="Pastikan data sudah benar."
        submitLabel={hooks.editingLeave ? "Simpan" : "Kirim"}
        isSubmitting={hooks.leaveQuery.isPending}
        onSubmit={hooks.leaveForm.handleSubmit((values) => hooks.saveLeave(values))}
      >
        <FormField label="Izin" htmlFor="leave_type" error={hooks.leaveForm.formState.errors.type?.message}>
          <Select value={hooks.leaveForm.watch("type")} onValueChange={(v) => hooks.leaveForm.setValue("type", v as LeaveType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="izin_direncanakan">Izin Direncanakan</SelectItem>
              <SelectItem value="izin_mendesak">Izin Mendesak</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Jenis" htmlFor="leave_category" error={hooks.leaveForm.formState.errors.category?.message}>
          <Select value={hooks.leaveForm.watch("category")} onValueChange={(v) => hooks.leaveForm.setValue("category", v as LeaveCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tidak_masuk">Tidak Masuk</SelectItem>
              <SelectItem value="datang_terlambat">Datang Terlambat</SelectItem>
              <SelectItem value="pulang_cepat">Pulang Cepat</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        {watchedCategory === "tidak_masuk" ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mulai" htmlFor="leave_start" error={hooks.leaveForm.formState.errors.start_date?.message}>
              <Input id="leave_start" type="date" {...hooks.leaveForm.register("start_date")} />
            </FormField>
            <FormField label="Selesai" htmlFor="leave_end" error={hooks.leaveForm.formState.errors.end_date?.message}>
              <Input id="leave_end" type="date" {...hooks.leaveForm.register("end_date")} />
            </FormField>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tanggal" htmlFor="leave_date" error={hooks.leaveForm.formState.errors.start_date?.message}>
              <Input id="leave_date" type="date" {...hooks.leaveForm.register("start_date")} />
            </FormField>
            <FormField label="Jam" htmlFor="leave_time" error={hooks.leaveForm.formState.errors.time_value?.message}>
              <Input id="leave_time" type="time" {...hooks.leaveForm.register("time_value")} />
            </FormField>
          </div>
        )}
        <FormField label="Alasan" htmlFor="leave_reason" error={hooks.leaveForm.formState.errors.reason?.message}>
          <Textarea id="leave_reason" {...hooks.leaveForm.register("reason")} rows={3} placeholder="Jelaskan alasan..." />
        </FormField>
      </ModalFormShell>

      <Dialog open={hooks.leaveDeleteModal.open} onOpenChange={hooks.leaveDeleteModal.setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batal Pengajuan</DialogTitle>
            <DialogDescription>
              {hooks.editingLeave ? `Batalkan pengajuan ${typeLabels[hooks.editingLeave.type as LeaveType] || ""} dari ${hooks.editingLeave.start_date}?` : "Batalkan pengajuan ini?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button type="button" variant="destructive" disabled={hooks.deleteLeavePending} onClick={() => void hooks.deleteLeave()}>
              {hooks.deleteLeavePending ? "Membatalkan..." : "Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
