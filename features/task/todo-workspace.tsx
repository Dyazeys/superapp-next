"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/features/task/kanban-board";
import { ArchiveDialog } from "@/features/task/archive-dialog";
import { useTaskTodos, useUsers } from "@/features/task/use-task-module";
import { taskApi } from "@/features/task/api";
import type { TaskTodo, TaskStatus, TaskPriority } from "@/types/task";

export function TaskTodoKanbanWorkspace() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "mock";
  const queryClient = useQueryClient();
  const hooks = useTaskTodos(userId);
  const usersQuery = useUsers();
  const users = usersQuery.data ?? [];
  const todos = hooks.todosQuery.data ?? [];
  const [archiveOpen, setArchiveOpen] = useState(false);

  const archivedQuery = useQuery({
    queryKey: ["task-todos", "archived"],
    queryFn: () => taskApi.todos.listArchived(),
  });
  const archivedTodos = archivedQuery.data ?? [];

  async function handleRestore(id: string) {
    try {
      await taskApi.todos.unarchive(id);
      await queryClient.invalidateQueries({ queryKey: ["task-todos"] });
      toast.success("Tugas dikembalikan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengembalikan");
    }
  }

  async function handleDelete(todo: TaskTodo) {
    try {
      await taskApi.todos.remove(todo.id);
      await queryClient.invalidateQueries({ queryKey: ["task-todos"] });
      toast.success("Tugas dihapus permanen");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    }
  }

  return (
    <PageShell
      eyebrow="Tugas"
      title="To Do Saya"
      description="Kanban tugas pribadi. Kelola tugas dari backlog hingga selesai."
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openTodoModal()}>
            <Plus className="size-4" />
            Tambah Tugas
          </Button>
        </div>
        <KanbanBoard
          todos={todos}
          users={users}
          onEdit={hooks.openTodoModal}
          onMove={hooks.moveTask}
          onArchive={hooks.archiveTask}
          onShowArchive={() => setArchiveOpen(true)}
          archivedCount={archivedTodos.length}
        />
      </div>

      <ModalFormShell
        open={hooks.todoModal.open}
        onOpenChange={hooks.todoModal.setOpen}
        title={hooks.editingTodo ? "Edit Tugas" : "Tambah Tugas"}
        description="Isi detail tugas."
        submitLabel={hooks.editingTodo ? "Simpan" : "Buat"}
        isSubmitting={hooks.todosQuery.isPending}
        onSubmit={hooks.todoForm.handleSubmit((values) => hooks.saveTodo(values))}
      >
        <FormField label="Judul" htmlFor="todo_title" error={hooks.todoForm.formState.errors.title?.message}>
          <Input id="todo_title" {...hooks.todoForm.register("title")} placeholder="Nama tugas..." />
        </FormField>
        <FormField label="Deskripsi" htmlFor="todo_desc" error={hooks.todoForm.formState.errors.description?.message}>
          <Textarea id="todo_desc" {...hooks.todoForm.register("description")} rows={2} placeholder="Deskripsi opsional..." />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status" htmlFor="todo_status" error={hooks.todoForm.formState.errors.status?.message}>
            <Select value={hooks.todoForm.watch("status")} onValueChange={(v) => hooks.todoForm.setValue("status", v as TaskStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Prioritas" htmlFor="todo_priority" error={hooks.todoForm.formState.errors.priority?.message}>
            <Select value={hooks.todoForm.watch("priority")} onValueChange={(v) => hooks.todoForm.setValue("priority", v as TaskPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Assignee" htmlFor="todo_assignee" error={hooks.todoForm.formState.errors.assignee_id?.message}>
            <Select value={hooks.todoForm.watch("assignee_id") ?? ""} onValueChange={(v) => hooks.todoForm.setValue("assignee_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Pilih user..." /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Deadline" htmlFor="todo_due" error={hooks.todoForm.formState.errors.due_date?.message}>
            <Input id="todo_due" type="date" {...hooks.todoForm.register("due_date")} />
          </FormField>
        </div>
      </ModalFormShell>

      <Dialog open={hooks.todoDeleteModal.open} onOpenChange={hooks.todoDeleteModal.setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>
              {hooks.editingTodo ? `Hapus tugas "${hooks.editingTodo.title}"?` : "Hapus tugas ini?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button type="button" variant="destructive" disabled={hooks.deleteTodoPending} onClick={() => void hooks.deleteTodo()}>
              {hooks.deleteTodoPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        archivedTodos={archivedTodos}
        users={users}
        onRestore={handleRestore}
        onDelete={handleDelete}
      />
    </PageShell>
  );
}
