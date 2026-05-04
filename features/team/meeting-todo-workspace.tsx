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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { teamApi } from "@/features/team/api";
import { meetingTodoInputSchema } from "@/schemas/task-module";
import type { TeamMeetingTodo, MeetingTodoStatus, TaskPriority } from "@/types/task";
import type { MeetingTodoInput } from "@/schemas/task-module";

const columnHelper = createColumnHelper<TeamMeetingTodo>();
const statusColors: Record<string, string> = { todo: "bg-slate-100 text-slate-700", in_progress: "bg-amber-100 text-amber-700", done: "bg-emerald-100 text-emerald-700" };
const priorityColors: Record<string, string> = { low: "bg-slate-100", medium: "bg-blue-100", high: "bg-red-100" };

export function TeamMeetingTodoWorkspace() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TeamMeetingTodo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<{ meeting_id: string; title: string; description: string; assignee_id: string; status: MeetingTodoStatus; priority: TaskPriority; due_date: string }>({ meeting_id: "", title: "", description: "", assignee_id: "", status: "todo", priority: "medium", due_date: "" });

  const { data: todos = [], isLoading, isError, error } = useQuery({
    queryKey: ["team-meeting-todos"],
    queryFn: () => teamApi.meetingTodos.list(),
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["team-meetings"],
    queryFn: () => teamApi.meetings.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: MeetingTodoInput) => teamApi.meetingTodos.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos"] });
      toast.success("To do berhasil dibuat");
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MeetingTodoInput> }) =>
      teamApi.meetingTodos.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos"] });
      toast.success("To do berhasil diupdate");
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.meetingTodos.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos"] });
      toast.success("To do berhasil dihapus");
      setDeleteOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns = [
    columnHelper.accessor("title", { header: "Tugas", cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span> }),
    columnHelper.display({ id: "meeting", header: "Meeting", cell: ({ row }) => `Meeting #${row.original.meeting_id}` }),
    columnHelper.accessor("status", { header: "Status", cell: (info) => <Badge className={statusColors[info.getValue()]}>{info.getValue()}</Badge> }),
    columnHelper.accessor("priority", { header: "Prioritas", cell: (info) => <Badge className={`${priorityColors[info.getValue()]} text-slate-700`}>{info.getValue()}</Badge> }),
    columnHelper.accessor("due_date", { header: "Deadline", cell: (info) => info.getValue() ?? "-" }),
    columnHelper.display({ id: "actions", header: "", cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button size="icon-xs" variant="outline" onClick={() => openEdit(row.original)}><Pencil className="size-3.5" /></Button>
        <Button size="icon-xs" variant="destructive" onClick={() => { setEditing(row.original); setDeleteOpen(true); }}><Trash2 className="size-3.5" /></Button>
      </div>
    )}),
  ];

  function openEdit(todo?: TeamMeetingTodo) {
    if (todo) { setEditing(todo); setForm({ meeting_id: todo.meeting_id, title: todo.title, description: todo.description ?? "", assignee_id: todo.assignee_id ?? "", status: todo.status, priority: todo.priority, due_date: todo.due_date ?? "" }); }
    else { setEditing(null); setForm({ meeting_id: "", title: "", description: "", assignee_id: "", status: "todo", priority: "medium", due_date: "" }); }
    setModalOpen(true);
  }

  function save() {
    const parsed = meetingTodoInputSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: parsed.data });
    } else {
      createMutation.mutate(parsed.data);
    }
  }

  function deleteTodo() {
    if (!editing) return;
    deleteMutation.mutate(editing.id);
  }

  return (
    <PageShell eyebrow="Meeting" title="To Do Meeting" description="Action items dari meeting dengan PIC dan deadline.">
      {isLoading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="size-6 animate-spin text-slate-400" /></div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{(error as Error)?.message || "Gagal memuat data"}</div>
      ) : (
        <div className="space-y-5">
          <div className="flex justify-end"><Button size="sm" onClick={() => openEdit()}><Plus className="size-4" /> Tambah To Do</Button></div>
          <DataTable columns={columns} data={todos} emptyMessage="Belum ada to do." pagination={{ enabled: true, pageSize: 10 }} />
        </div>
      )}
      <ModalFormShell open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit To Do" : "Tambah To Do"} description="Isi detail action item." submitLabel={editing ? "Simpan" : "Buat"} isSubmitting={isPending} onSubmit={save}>
        <FormField label="Meeting" htmlFor="todo_meeting">
          <Select value={form.meeting_id} onValueChange={(v) => setForm({...form, meeting_id: v ?? ""})}>
            <SelectTrigger><SelectValue placeholder="Pilih meeting" /></SelectTrigger>
            <SelectContent>
              {meetings.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Judul" htmlFor="todo_title"><Input id="todo_title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></FormField>
        <FormField label="Deskripsi" htmlFor="todo_desc"><Textarea id="todo_desc" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Status" htmlFor="todo_status">
            <Select value={form.status} onValueChange={(v) => setForm({...form, status: v as MeetingTodoStatus})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Prioritas" htmlFor="todo_priority">
            <Select value={form.priority} onValueChange={(v) => setForm({...form, priority: v as TaskPriority})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Deadline" htmlFor="todo_due"><Input id="todo_due" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></FormField>
        </div>
      </ModalFormShell>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Hapus To Do</DialogTitle><DialogDescription>Hapus to do ini?</DialogDescription></DialogHeader><DialogFooter showCloseButton><Button variant="destructive" onClick={deleteTodo} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Hapus"}</Button></DialogFooter></DialogContent></Dialog>
    </PageShell>
  );
}
