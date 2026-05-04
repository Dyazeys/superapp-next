"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { teamApi } from "@/features/team/api";
import { meetingInputSchema } from "@/schemas/task-module";
import type { TeamMeeting } from "@/types/task";
import type { MeetingInput } from "@/schemas/task-module";

const columnHelper = createColumnHelper<TeamMeeting>();

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
};

export function TeamMeetingNotesWorkspace() {
  const queryClient = useQueryClient();
  const [editingMeeting, setEditingMeeting] = useState<TeamMeeting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", date: "", start_time: "", end_time: "", location: "", notes: "" });

  const { data: meetings = [], isLoading, isError, error } = useQuery({
    queryKey: ["team-meetings"],
    queryFn: () => teamApi.meetings.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: MeetingInput) => teamApi.meetings.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meetings"] });
      toast.success("Meeting berhasil dibuat");
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MeetingInput> }) =>
      teamApi.meetings.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meetings"] });
      toast.success("Meeting berhasil diupdate");
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.meetings.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meetings"] });
      toast.success("Meeting berhasil dihapus");
      setDeleteModalOpen(false);
      setEditingMeeting(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns = [
    columnHelper.accessor("title", { header: "Judul", cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span> }),
    columnHelper.accessor("date", { header: "Tanggal", cell: (info) => info.getValue() }),
    columnHelper.accessor("location", { header: "Tempat", cell: (info) => info.getValue() ?? "-" }),
    columnHelper.accessor("status", { header: "Status", cell: (info) => <Badge className={statusColors[info.getValue()]}>{info.getValue()}</Badge> }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => openEdit(row.original)}><Pencil className="size-3.5" /></Button>
          <Button size="icon-xs" variant="destructive" onClick={() => { setEditingMeeting(row.original); setDeleteModalOpen(true); }}><Trash2 className="size-3.5" /></Button>
        </div>
      ),
    }),
  ];

  function openEdit(meeting?: TeamMeeting) {
    if (meeting) {
      setEditingMeeting(meeting);
      setFormData({ title: meeting.title, date: meeting.date, start_time: meeting.start_time, end_time: meeting.end_time, location: meeting.location ?? "", notes: meeting.notes ?? "" });
    } else {
      setEditingMeeting(null);
      setFormData({ title: "", date: "", start_time: "", end_time: "", location: "", notes: "" });
    }
    setModalOpen(true);
  }

  function save() {
    const parsed = meetingInputSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (editingMeeting) {
      updateMutation.mutate({ id: editingMeeting.id, payload: parsed.data });
    } else {
      createMutation.mutate(parsed.data);
    }
  }

  function deleteMeeting() {
    if (!editingMeeting) return;
    deleteMutation.mutate(editingMeeting.id);
  }

  return (
    <PageShell eyebrow="Meeting" title="Notulen Rapat" description="Kelola notulen meeting dan ajukan untuk approval.">
      {isLoading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="size-6 animate-spin text-slate-400" /></div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{(error as Error)?.message || "Gagal memuat data"}</div>
      ) : (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openEdit()}><Plus className="size-4" /> Buat Meeting</Button>
          </div>
          <DataTable columns={columns} data={meetings} emptyMessage="Belum ada meeting." pagination={{ enabled: true, pageSize: 10 }} />
        </div>
      )}

      <ModalFormShell open={modalOpen} onOpenChange={setModalOpen} title={editingMeeting ? "Edit Meeting" : "Buat Meeting"} description="Isi detail meeting." submitLabel={editingMeeting ? "Simpan" : "Buat"} isSubmitting={isPending} onSubmit={save}>
        <FormField label="Judul" htmlFor="meeting_title"><Input id="meeting_title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Tanggal" htmlFor="meeting_date"><Input id="meeting_date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></FormField>
          <FormField label="Mulai" htmlFor="meeting_start"><Input id="meeting_start" type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></FormField>
          <FormField label="Selesai" htmlFor="meeting_end"><Input id="meeting_end" type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></FormField>
        </div>
        <FormField label="Tempat" htmlFor="meeting_location"><Input id="meeting_location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></FormField>
        <FormField label="Notulen" htmlFor="meeting_notes"><Textarea id="meeting_notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={5} /></FormField>
      </ModalFormShell>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Meeting</DialogTitle><DialogDescription>Hapus meeting ini?</DialogDescription></DialogHeader>
          <DialogFooter showCloseButton><Button variant="destructive" onClick={deleteMeeting} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Hapus"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
