"use client";

import { Pencil, Archive, Play, Check, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskTodo, UserBrief, TaskStatus } from "@/types/task";

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

type TaskCardProps = {
  todo: TaskTodo;
  users: UserBrief[];
  onEdit?: (todo: TaskTodo) => void;
  onMove: (todo: TaskTodo, status: TaskStatus) => void;
  onArchive: (todo: TaskTodo) => void;
};

export function TaskCard({ todo, users, onEdit, onMove, onArchive }: TaskCardProps) {
  const creator = users.find(u => u.id === todo.creator_id);
  const assignee = users.find(u => u.id === todo.assignee_id);

  function getActions() {
    switch (todo.status) {
      case "backlog":
        return (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onMove(todo, "todo")}>
            <ArrowRight className="size-3 mr-1" />
            Pindah ke Todo
          </Button>
        );
      case "todo":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onMove(todo, "backlog")}>
              <RotateCcw className="size-3 mr-1" />
              Backlog
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => onMove(todo, "in_progress")}>
              <Play className="size-3 mr-1" />
              Mulai
            </Button>
          </div>
        );
      case "in_progress":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onMove(todo, "todo")}>
              <ArrowLeft className="size-3 mr-1" />
              Todo
            </Button>
            <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => onMove(todo, "done")}>
              <Check className="size-3 mr-1" />
              Selesai
            </Button>
          </div>
        );
      case "done":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onMove(todo, "in_progress")}>
              <RotateCcw className="size-3 mr-1" />
              Reopen
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => onArchive(todo)}>
              <Archive className="size-3 mr-1" />
              Arsip
            </Button>
          </div>
        );
    }
  }

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{todo.title}</p>
          {todo.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{todo.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-400">
              Dari: {creator?.full_name ?? "Unknown"}
            </span>
            {todo.assignee_id && assignee && (
              <span className="text-xs text-slate-400">
                → {assignee.full_name}
              </span>
            )}
          </div>
        </div>
        {onEdit && (
          <Button size="icon-xs" variant="ghost" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => onEdit(todo)}>
            <Pencil className="size-3" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Badge className={`${priorityColors[todo.priority]} text-xs`}>
            {priorityLabels[todo.priority]}
          </Badge>
          {todo.due_date && (
            <span className="text-xs text-slate-500">{todo.due_date}</span>
          )}
          {todo.started_at && (
            <span className="text-xs text-slate-400">
              {new Date(todo.started_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        {getActions()}
      </div>
    </div>
  );
}