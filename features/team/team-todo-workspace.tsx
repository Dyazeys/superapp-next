"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, X } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTeamTodos, useTeamRoutines, useUsers } from "@/features/task/use-task-module";
import { taskApi } from "@/features/task/api";
import type { TaskTodo, TaskRoutine, UserBrief, TaskStatus, TaskPriority } from "@/types/task";

const userColumnHelper = createColumnHelper<UserBrief>();

const statusColors: Record<string, string> = {
  backlog: "bg-slate-100 text-slate-600",
  todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

export function TeamTodoWorkspace() {
  const queryClient = useQueryClient();
  const hooks = useTeamTodos();
  const routinesHook = useTeamRoutines();
  const usersQuery = useUsers();
  const users = usersQuery.data ?? [];
  const todos = hooks.todosQuery.data ?? [];
  const routines = routinesHook.routinesQuery.data ?? [];
  const [tab, setTab] = useState<"tugas" | "rutinitas">("tugas");

  const [taskUser, setTaskUser] = useState<UserBrief | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTodo | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("backlog");
  const [taskDue, setTaskDue] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [deletingTask, setDeletingTask] = useState<TaskTodo | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);

  const [routineUser, setRoutineUser] = useState<UserBrief | null>(null);
  const [routineFormOpen, setRoutineFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<TaskRoutine | null>(null);
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineDesc, setRoutineDesc] = useState("");
  const [deletingRoutine, setDeletingRoutine] = useState<TaskRoutine | null>(null);
  const [routineSaving, setRoutineSaving] = useState(false);

  function invalidateTasks() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["team-all-todos"] }),
      queryClient.invalidateQueries({ queryKey: ["task-todos"] }),
    ]);
  }

  function invalidateRoutines() {
    return queryClient.invalidateQueries({ queryKey: ["task-routines"] });
  }

  function openTaskForm(task?: TaskTodo) {
    setEditingTask(task ?? null);
    setTaskTitle(task?.title ?? "");
    setTaskPriority(task?.priority ?? "medium");
    setTaskStatus(task?.status ?? "backlog");
    setTaskDue(task?.due_date ?? "");
    setTaskDesc(task?.description ?? "");
    setTaskFormOpen(true);
  }

  function closeTaskForm() {
    setTaskFormOpen(false);
    setEditingTask(null);
  }

  async function saveTask() {
    if (!taskTitle.trim() || !taskUser) return;
    setTaskSaving(true);
    try {
      if (editingTask) {
        await taskApi.todos.update(editingTask.id, {
          title: taskTitle,
          priority: taskPriority,
          status: taskStatus,
          due_date: taskDue || null,
          description: taskDesc || null,
        });
        toast.success("Tugas diupdate");
      } else {
        await taskApi.todos.create({
          title: taskTitle,
          priority: taskPriority,
          status: taskStatus,
          due_date: taskDue || null,
          description: taskDesc || null,
          assignee_id: taskUser.id,
        });
        toast.success("Tugas ditambahkan");
      }
      await invalidateTasks();
      closeTaskForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setTaskSaving(false);
    }
  }

  async function confirmDeleteTask() {
    if (!deletingTask) return;
    try {
      await taskApi.todos.remove(deletingTask.id);
      await invalidateTasks();
      toast.success("Tugas dihapus");
      setDeletingTask(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    }
  }

  function openRoutineForm(routine?: TaskRoutine) {
    setEditingRoutine(routine ?? null);
    setRoutineTitle(routine?.title ?? "");
    setRoutineDesc(routine?.description ?? "");
    setRoutineFormOpen(true);
  }

  function closeRoutineForm() {
    setRoutineFormOpen(false);
    setEditingRoutine(null);
  }

  async function saveRoutine() {
    if (!routineTitle.trim() || !routineUser) return;
    setRoutineSaving(true);
    try {
      if (editingRoutine) {
        await taskApi.routines.update(editingRoutine.id, {
          title: routineTitle,
          description: routineDesc || null,
        });
        toast.success("Rutinitas diupdate");
      } else {
        await taskApi.routines.create({
          title: routineTitle,
          description: routineDesc || null,
        }, routineUser.id);
        toast.success("Rutinitas ditambahkan");
      }
      await invalidateRoutines();
      closeRoutineForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setRoutineSaving(false);
    }
  }

  async function confirmDeleteRoutine() {
    if (!deletingRoutine) return;
    try {
      await taskApi.routines.remove(deletingRoutine.id);
      await invalidateRoutines();
      toast.success("Rutinitas dihapus");
      setDeletingRoutine(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    }
  }

  const userTaskCounts = new Map<string, number>();
  todos.forEach(t => { if (t.assignee_id) userTaskCounts.set(t.assignee_id, (userTaskCounts.get(t.assignee_id) ?? 0) + 1); });

  const userRoutineCounts = new Map<string, number>();
  routines.forEach(r => userRoutineCounts.set(r.user_id, (userRoutineCounts.get(r.user_id) ?? 0) + 1));

  const taskUserTodos = taskUser ? todos.filter(t => t.assignee_id === taskUser.id) : [];
  const routineUserRoutines = routineUser ? routines.filter(r => r.user_id === routineUser.id) : [];

  const taskUserColumns = [
    userColumnHelper.display({
      id: "name",
      header: "User",
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.full_name}</span>,
    }),
    userColumnHelper.display({
      id: "count",
      header: "Jumlah Tugas",
      cell: ({ row }) => {
        const count = userTaskCounts.get(row.original.id) ?? 0;
        return <Badge className="bg-slate-100 text-slate-700">{count}</Badge>;
      },
    }),
    userColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setTaskUser(row.original)}>
            <Pencil className="size-3.5 mr-1" />
            Kelola
          </Button>
        </div>
      ),
    }),
  ];

  const routineUserColumns = [
    userColumnHelper.display({
      id: "name",
      header: "User",
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.full_name}</span>,
    }),
    userColumnHelper.display({
      id: "count",
      header: "Jumlah Rutinitas",
      cell: ({ row }) => {
        const count = userRoutineCounts.get(row.original.id) ?? 0;
        return <Badge className="bg-slate-100 text-slate-700">{count}</Badge>;
      },
    }),
    userColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setRoutineUser(row.original)}>
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
      title="Kelola Tugas Tim"
      description="Atur tugas dan rutinitas per anggota tim."
    >
      <div className="space-y-5">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab("tugas")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === "tugas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tugas
          </button>
          <button
            type="button"
            onClick={() => setTab("rutinitas")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === "rutinitas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Rutinitas
          </button>
        </div>

        {tab === "tugas" ? (
          <DataTable columns={taskUserColumns} data={users} emptyMessage="Tidak ada user." pagination={{ enabled: true, pageSize: 15 }} />
        ) : (
          <DataTable columns={routineUserColumns} data={users} emptyMessage="Tidak ada user." pagination={{ enabled: true, pageSize: 15 }} />
        )}
      </div>

      <Dialog
        open={!!taskUser}
        onOpenChange={(open) => { if (!open) { setTaskUser(null); closeTaskForm(); } }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Tugas: {taskUser?.full_name}</DialogTitle>
            <DialogDescription>Tambah, edit, atau hapus tugas untuk user ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {taskFormOpen && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{editingTask ? "Edit Tugas" : "Tambah Tugas Baru"}</span>
                  <Button size="icon-xs" variant="ghost" onClick={closeTaskForm}><X className="size-3.5" /></Button>
                </div>
                <FormField label="Judul" htmlFor="ut_title">
                  <Input id="ut_title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Apa yang perlu dilakukan?" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Prioritas" htmlFor="ut_priority">
                    <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as TaskPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Status" htmlFor="ut_status">
                    <Select value={taskStatus} onValueChange={(v) => setTaskStatus(v as TaskStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <FormField label="Deadline" htmlFor="ut_due">
                  <Input id="ut_due" type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
                </FormField>
                <FormField label="Deskripsi" htmlFor="ut_desc">
                  <Textarea id="ut_desc" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={2} placeholder="Detail tugas..." />
                </FormField>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={closeTaskForm}>Batal</Button>
                  <Button size="sm" onClick={saveTask} disabled={taskSaving || !taskTitle.trim()}>
                    {taskSaving ? "Menyimpan..." : editingTask ? "Simpan" : "Tambah"}
                  </Button>
                </div>
              </div>
            )}

            {!taskFormOpen && (
              <Button size="sm" onClick={() => openTaskForm()}>
                <Plus className="size-4" />
                Tambah Tugas
              </Button>
            )}

            {taskUserTodos.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Belum ada tugas untuk user ini.</p>
            ) : (
              <div className="space-y-2">
                {taskUserTodos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{todo.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={priorityColors[todo.priority]}>{todo.priority}</Badge>
                        <Badge className={statusColors[todo.status]}>{todo.status}</Badge>
                        {todo.due_date && <span className="text-xs text-slate-500">{todo.due_date}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon-xs" variant="ghost" onClick={() => openTaskForm(todo)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setDeletingTask(todo)}>
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

      <Dialog
        open={!!routineUser}
        onOpenChange={(open) => { if (!open) { setRoutineUser(null); closeRoutineForm(); } }}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Rutinitas: {routineUser?.full_name}</DialogTitle>
            <DialogDescription>Tambah, edit, atau hapus rutinitas untuk user ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {routineFormOpen && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{editingRoutine ? "Edit Rutinitas" : "Tambah Rutinitas Baru"}</span>
                  <Button size="icon-xs" variant="ghost" onClick={closeRoutineForm}><X className="size-3.5" /></Button>
                </div>
                <FormField label="Judul" htmlFor="ur_title">
                  <Input id="ur_title" value={routineTitle} onChange={e => setRoutineTitle(e.target.value)} placeholder="Nama rutinitas..." />
                </FormField>
                <FormField label="Deskripsi (opsional)" htmlFor="ur_desc">
                  <Textarea id="ur_desc" value={routineDesc} onChange={e => setRoutineDesc(e.target.value)} rows={2} placeholder="Detail rutinitas..." />
                </FormField>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={closeRoutineForm}>Batal</Button>
                  <Button size="sm" onClick={saveRoutine} disabled={routineSaving || !routineTitle.trim()}>
                    {routineSaving ? "Menyimpan..." : editingRoutine ? "Simpan" : "Tambah"}
                  </Button>
                </div>
              </div>
            )}

            {!routineFormOpen && (
              <Button size="sm" onClick={() => openRoutineForm()}>
                <Plus className="size-4" />
                Tambah Rutinitas
              </Button>
            )}

            {routineUserRoutines.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Belum ada rutinitas untuk user ini.</p>
            ) : (
              <div className="space-y-2">
                {routineUserRoutines.map(routine => (
                  <div key={routine.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{routine.title}</p>
                      {routine.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{routine.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon-xs" variant="ghost" onClick={() => openRoutineForm(routine)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setDeletingRoutine(routine)}>
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

      <Dialog open={!!deletingTask} onOpenChange={(open) => { if (!open) setDeletingTask(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>Hapus tugas &quot;{deletingTask?.title}&quot;? Tindakan ini permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTask(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingRoutine} onOpenChange={(open) => { if (!open) setDeletingRoutine(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Rutinitas</DialogTitle>
            <DialogDescription>Hapus rutinitas &quot;{deletingRoutine?.title}&quot;? Tindakan ini permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRoutine(null)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDeleteRoutine}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
