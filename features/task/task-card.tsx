"use client";

import { Pencil, Archive, Play, Check, ArrowLeft, ArrowRight, RotateCcw, Calendar } from "lucide-react";
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
          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => onMove(todo, "todo")}>
            <ArrowRight className="size-3" />
            Todo
          </Button>
        );
      case "todo":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => onMove(todo, "backlog")}>
              <RotateCcw className="size-3" />
              Back
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => onMove(todo, "in_progress")}>
              <Play className="size-3" />
              Mulai
            </Button>
          </div>
        );
      case "in_progress":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => onMove(todo, "todo")}>
              <ArrowLeft className="size-3" />
              Todo
            </Button>
            <Button size="sm" className="h-6 text-xs gap-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => onMove(todo, "done")}>
              <Check className="size-3" />
              Done
            </Button>
          </div>
        );
      case "done":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => onMove(todo, "in_progress")}>
              <RotateCcw className="size-3" />
              Reopen
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-orange-600" onClick={() => onArchive(todo)}>
              <Archive className="size-3" />
              Arsip
            </Button>
          </div>
        );
    }
  }

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{todo.title}</p>
          {todo.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{todo.description}</p>
          )}
          {(creator || assignee) && (
            <p className="text-xs text-slate-400 mt-1 truncate">
              {creator?.full_name}{assignee ? ` → ${assignee.full_name}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2 shrink-0">
          {todo.due_date && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-0.5 whitespace-nowrap">
              <Calendar className="size-3" />
              {todo.due_date}
            </span>
          )}
          {onEdit && (
            <Button size="icon-xs" variant="ghost" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => onEdit(todo)}>
              <Pencil className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${priorityColors[todo.priority]} text-xs`}>
            {priorityLabels[todo.priority]}
          </Badge>
        </div>
        <div className="flex justify-end mt-1.5">
          {getActions()}
        </div>
      </div>
    </div>
  );
}