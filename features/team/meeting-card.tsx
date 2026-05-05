"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Trash2, Loader2, Square, CheckSquare, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { teamApi } from "@/features/team/api";
import type { TeamMeeting, TeamMeetingTodo, MeetingTodoStatus, TaskPriority } from "@/types/task";
import type { MeetingTodoInput } from "@/schemas/task-module";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

const priorityCycle: TaskPriority[] = ["low", "medium", "high"];

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

type MeetingCardProps = {
  meeting: TeamMeeting;
  onEdit: (meeting: TeamMeeting) => void;
  onDelete: (meeting: TeamMeeting) => void;
};

export function MeetingCard({ meeting, onEdit, onDelete }: MeetingCardProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data: todos = [], isLoading: todosLoading } = useQuery({
    queryKey: ["team-meeting-todos", meeting.id],
    queryFn: () => teamApi.meetingTodos.list(meeting.id),
    enabled: expanded,
  });

  const createMutation = useMutation({
    mutationFn: (payload: MeetingTodoInput) => teamApi.meetingTodos.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos", meeting.id] });
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos"] });
      toast.success("Action item ditambahkan");
      setNewTitle("");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MeetingTodoInput> }) =>
      teamApi.meetingTodos.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos", meeting.id] });
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos"] });
      toast.success("Action item diupdate");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.meetingTodos.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos", meeting.id] });
      queryClient.invalidateQueries({ queryKey: ["team-meeting-todos"] });
      toast.success("Action item dihapus");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleToggle(todo: TeamMeetingTodo) {
    const newStatus: MeetingTodoStatus = todo.status === "done" ? "todo" : "done";
    updateMutation.mutate({ id: todo.id, payload: { status: newStatus } });
  }

  function handleCyclePriority(todo: TeamMeetingTodo) {
    const idx = priorityCycle.indexOf(todo.priority);
    const next = priorityCycle[(idx + 1) % priorityCycle.length];
    updateMutation.mutate({ id: todo.id, payload: { priority: next } });
  }

  function handleAddTodo() {
    if (!newTitle.trim()) return;
    createMutation.mutate({ meeting_id: meeting.id, title: newTitle.trim(), priority: "medium", status: "todo" } as MeetingTodoInput);
  }

  function handleDeleteTodo(todo: TeamMeetingTodo) {
    if (!confirm(`Hapus "${todo.title}"?`)) return;
    deleteMutation.mutate(todo.id);
  }

  const isSaving = createMutation.isPending;
  const doneCount = todos.filter((t) => t.status === "done").length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        {expanded ? <ChevronDown className="size-4 shrink-0 text-slate-400" /> : <ChevronRight className="size-4 shrink-0 text-slate-400" />}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-900">{meeting.title}</span>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{meeting.date}</span>
            <span>{meeting.start_time}-{meeting.end_time}</span>
          </div>
        </div>
        {todos.length > 0 && <span className="text-xs text-slate-400 shrink-0">{doneCount}/{todos.length}</span>}
        <Badge className={`${statusColors[meeting.status]} text-xs shrink-0`}>{meeting.status}</Badge>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-4">
          {meeting.location && (
            <p className="text-xs text-slate-500 inline-flex items-center gap-1"><MapPin className="size-3" />{meeting.location}</p>
          )}

          {meeting.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Notulen</p>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{meeting.notes}</div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Action Items</p>

            {todosLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="size-4 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-1 mb-2">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
                    <button type="button" onClick={() => handleToggle(todo)} className="shrink-0 text-slate-400 hover:text-slate-600">
                      {todo.status === "done" ? <CheckSquare className="size-4 text-emerald-500" /> : <Square className="size-4" />}
                    </button>
                    <span className={`flex-1 min-w-0 truncate ${todo.status === "done" ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {todo.title}
                    </span>
                    <button type="button" onClick={() => handleCyclePriority(todo)}>
                      <Badge className={`${priorityColors[todo.priority]} text-xs shrink-0 cursor-pointer hover:opacity-80`}>
                        {priorityLabels[todo.priority]}
                      </Badge>
                    </button>
                    {todo.due_date && <span className="text-xs text-slate-400 shrink-0">{todo.due_date}</span>}
                    <button type="button" onClick={() => handleDeleteTodo(todo)} className="shrink-0 text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
                {todos.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada action item.</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tambah action item..."
                className="h-8 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTodo(); }}
              />
              <Button size="sm" className="h-8 text-xs shrink-0" onClick={handleAddTodo} disabled={!newTitle.trim() || isSaving}>
                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(meeting)}>
              <ChevronRight className="size-3 mr-1" />Edit Meeting
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => onDelete(meeting)}>
              <Trash2 className="size-3 mr-1" />Hapus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
