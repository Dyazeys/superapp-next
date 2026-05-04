"use client";

import { Trash2, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TaskTodo, UserBrief } from "@/types/task";

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

type ArchiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archivedTodos: TaskTodo[];
  users: UserBrief[];
  onRestore: (id: string) => void;
  onDelete: (todo: TaskTodo) => void;
};

export function ArchiveDialog({ open, onOpenChange, archivedTodos, users, onRestore, onDelete }: ArchiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Arsip Tugas</DialogTitle>
          <DialogDescription>
            {archivedTodos.length} tugas yang sudah diarsipkan.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {archivedTodos.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Belum ada arsip.</p>
          ) : (
            archivedTodos.map((todo) => {
              const user = users.find(u => u.id === todo.assignee_id);
              return (
                <div key={todo.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{todo.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${priorityColors[todo.priority]} text-xs`}>{todo.priority}</Badge>
                      {user && <span className="text-xs text-slate-500">{user.full_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button size="icon-xs" variant="outline" onClick={() => onRestore(todo.id)} title="Kembalikan">
                      <RotateCcw className="size-3" />
                    </Button>
                    <Button size="icon-xs" variant="destructive" onClick={() => onDelete(todo)} title="Hapus permanen">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}