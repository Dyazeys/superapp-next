"use client";

import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/task/task-card";
import type { TaskTodo, UserBrief, TaskStatus } from "@/types/task";

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "border-t-slate-300" },
  { status: "todo", label: "To Do", color: "border-t-slate-400" },
  { status: "in_progress", label: "In Progress", color: "border-t-slate-500" },
  { status: "done", label: "Done", color: "border-t-slate-600" },
];

type KanbanBoardProps = {
  todos: TaskTodo[];
  users: UserBrief[];
  onEdit?: (todo: TaskTodo) => void;
  onMove: (todo: TaskTodo, status: TaskStatus) => void;
  onArchive: (todo: TaskTodo) => void;
  onShowArchive?: () => void;
  archivedCount?: number;
};

export function KanbanBoard({ todos, users, onEdit, onMove, onArchive, onShowArchive, archivedCount }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const colTodos = todos.filter(t => t.status === col.status);
        return (
          <div key={col.status} className={`rounded-lg border border-slate-200 border-t-4 ${col.color} bg-slate-50/50 min-w-0`}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{col.label}</span>
                <span className="text-xs text-slate-500 bg-slate-200 rounded-full px-2 py-0.5">{colTodos.length}</span>
              </div>
            </div>
            <div className="space-y-2 p-2 min-h-[120px]">
              {colTodos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada tugas</p>
              ) : (
                colTodos.map((todo) => (
                  <TaskCard
                    key={todo.id}
                    todo={todo}
                    users={users}
                    onEdit={onEdit}
                    onMove={onMove}
                    onArchive={onArchive}
                  />
                ))
              )}
            </div>
            {col.status === "done" && onShowArchive && archivedCount !== undefined && archivedCount > 0 && (
              <div className="px-3 pb-2">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-slate-500" onClick={onShowArchive}>
                  <Archive className="size-3 mr-1" />
                  Arsip ({archivedCount})
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}