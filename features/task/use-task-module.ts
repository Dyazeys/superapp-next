"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useModalState } from "@/hooks/use-modal-state";
import { taskApi } from "@/features/task/api";
import {
  todoInputSchema,
  kpiTeamInputSchema,
  leaveRequestInputSchema,
  eventInputSchema,
  routineInputSchema,
  routineTeamInputSchema,
  type TodoInput,
  type KpiTeamInput,
  type LeaveRequestInput,
  type EventInput,
  type RoutineInput,
  type RoutineTeamInput,
} from "@/schemas/task-module";
import type {
  TaskTodo,
  TaskKpi,
  TaskLeaveRequest,
  TaskEvent,
  TaskRoutine,
} from "@/types/task";

const TASK_TODOS_KEY = ["task-todos"] as const;
const TASK_KPIS_KEY = ["task-kpis"] as const;
const TASK_ATTENDANCE_KEY = ["task-attendance"] as const;
const TASK_LEAVE_KEY = ["task-leave"] as const;
const TASK_EVENTS_KEY = ["task-events"] as const;

export function useTaskTodos(userId: string) {
  const queryClient = useQueryClient();
  const [editingTodo, setEditingTodo] = useState<TaskTodo | null>(null);
  const todoModal = useModalState();
  const todoDeleteModal = useModalState();
  const [deleteTodoPending, setDeleteTodoPending] = useState(false);

  const todosQuery = useQuery({
    queryKey: [...TASK_TODOS_KEY, userId],
    queryFn: () => taskApi.todos.list(userId),
  });

  const todoForm = useForm<TodoInput>({
    resolver: zodResolver(todoInputSchema),
    defaultValues: {
      title: "",
      description: null,
      status: "backlog",
      priority: "medium",
      assignee_id: null,
      due_date: null,
    },
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: TASK_TODOS_KEY });
  }

  function openTodoModal(todo?: TaskTodo) {
    setEditingTodo(todo ?? null);
    todoForm.reset({
      title: todo?.title ?? "",
      description: todo?.description ?? null,
      status: todo?.status ?? "backlog",
      priority: todo?.priority ?? "medium",
      assignee_id: todo?.assignee_id ?? null,
      due_date: todo?.due_date ?? null,
    });
    todoModal.openModal();
  }

  function openTodoDeleteModal(todo: TaskTodo) {
    setEditingTodo(todo);
    todoDeleteModal.openModal();
  }

  async function saveTodo(values: TodoInput) {
    try {
      if (editingTodo) {
        await taskApi.todos.update(editingTodo.id, values);
        toast.success("Todo updated");
      } else {
        await taskApi.todos.create(values, userId);
        toast.success("Todo created");
      }
      await invalidate();
      setEditingTodo(null);
      todoModal.closeModal();
      todoForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      throw error;
    }
  }

  async function deleteTodo() {
    if (!editingTodo) return;
    setDeleteTodoPending(true);
    try {
      await taskApi.todos.remove(editingTodo.id);
      await invalidate();
      toast.success("Todo deleted");
      setEditingTodo(null);
      todoDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
      throw error;
    } finally {
      setDeleteTodoPending(false);
    }
  }

  async function moveTask(todo: TaskTodo, newStatus: TaskTodo["status"]) {
    try {
      const payload: Partial<TodoInput> & { status?: TaskTodo["status"]; started_at?: string | null } = { status: newStatus };
      if (newStatus === "in_progress" && !todo.started_at) {
        payload.started_at = new Date().toISOString();
      }
      if (newStatus === "backlog" || newStatus === "todo") {
        payload.started_at = null;
      }
      await taskApi.todos.update(todo.id, payload);
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move task");
    }
  }

  async function archiveTask(todo: TaskTodo) {
    try {
      await taskApi.todos.archive(todo.id);
      await invalidate();
      toast.success("Task archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive");
    }
  }

  return {
    todosQuery,
    todoForm,
    todoModal,
    todoDeleteModal,
    editingTodo,
    deleteTodoPending,
    openTodoModal,
    openTodoDeleteModal,
    saveTodo,
    deleteTodo,
    moveTask,
    archiveTask,
  };
}

export function useTaskKpis(userId?: string) {
  const queryClient = useQueryClient();

  const kpisQuery = useQuery({
    queryKey: [...TASK_KPIS_KEY, userId],
    queryFn: () => taskApi.kpis.list(userId),
  });

  async function updateRealization(id: string, value: number) {
    try {
      await taskApi.kpis.updateRealization(id, value);
      await queryClient.invalidateQueries({ queryKey: TASK_KPIS_KEY });
      toast.success("Realisasi diperbarui, menunggu approval");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui realisasi");
    }
  }

  return { kpisQuery, updateRealization };
}

async function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000,
      })
    );
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

export function useTaskAttendance(userId?: string) {
  const queryClient = useQueryClient();
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  const todayQuery = useQuery({
    queryKey: [...TASK_ATTENDANCE_KEY, "today", userId],
    queryFn: () => taskApi.attendance.today(),
  });

  const historyQuery = useQuery({
    queryKey: [...TASK_ATTENDANCE_KEY, "history", userId],
    queryFn: () => taskApi.attendance.list(),
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [...TASK_ATTENDANCE_KEY, "today", userId] }),
      queryClient.invalidateQueries({ queryKey: [...TASK_ATTENDANCE_KEY, "history", userId] }),
    ]);
  }

  async function clockIn() {
    setClockingIn(true);
    try {
      const coords = await getCurrentPosition();
      await taskApi.attendance.clockIn(coords ?? undefined);
      await invalidate();
      toast.success("Clock in recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clock in");
    } finally {
      setClockingIn(false);
    }
  }

  async function clockOut() {
    setClockingOut(true);
    try {
      const coords = await getCurrentPosition();
      await taskApi.attendance.clockOut(coords ?? undefined);
      await invalidate();
      toast.success("Clock out recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clock out");
    } finally {
      setClockingOut(false);
    }
  }

  return {
    todayQuery,
    historyQuery,
    clockingIn,
    clockingOut,
    clockIn,
    clockOut,
  };
}

export function useTaskLeaveRequests() {
  const queryClient = useQueryClient();
  const [editingLeave, setEditingLeave] = useState<TaskLeaveRequest | null>(null);
  const leaveModal = useModalState();
  const leaveDeleteModal = useModalState();
  const [deleteLeavePending, setDeleteLeavePending] = useState(false);

  const leaveQuery = useQuery({
    queryKey: TASK_LEAVE_KEY,
    queryFn: taskApi.leaveRequests.list,
  });

  const leaveForm = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestInputSchema),
    defaultValues: {
      type: "izin_direncanakan",
      category: "tidak_masuk",
      start_date: "",
      end_date: "",
      time_value: null,
      reason: "",
      attachment_url: null,
    },
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: TASK_LEAVE_KEY });
  }

  function openLeaveModal(leave?: TaskLeaveRequest) {
    setEditingLeave(leave ?? null);
    leaveForm.reset({
      type: leave?.type ?? "izin_direncanakan",
      category: leave?.category ?? "tidak_masuk",
      start_date: leave?.start_date ?? "",
      end_date: leave?.end_date ?? "",
      time_value: leave?.time_value ?? null,
      reason: leave?.reason ?? "",
      attachment_url: leave?.attachment_url ?? null,
    });
    leaveModal.openModal();
  }

  function openLeaveDeleteModal(leave: TaskLeaveRequest) {
    setEditingLeave(leave);
    leaveDeleteModal.openModal();
  }

  async function saveLeave(values: LeaveRequestInput) {
    try {
      if (editingLeave) {
        await taskApi.leaveRequests.update(editingLeave.id, values);
        toast.success("Leave request updated");
      } else {
        await taskApi.leaveRequests.create(values);
        toast.success("Leave request submitted");
      }
      await invalidate();
      setEditingLeave(null);
      leaveModal.closeModal();
      leaveForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      throw error;
    }
  }

  async function deleteLeave() {
    if (!editingLeave) return;
    setDeleteLeavePending(true);
    try {
      await taskApi.leaveRequests.remove(editingLeave.id);
      await invalidate();
      toast.success("Leave request deleted");
      setEditingLeave(null);
      leaveDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
      throw error;
    } finally {
      setDeleteLeavePending(false);
    }
  }

  return {
    leaveQuery,
    leaveForm,
    leaveModal,
    leaveDeleteModal,
    editingLeave,
    deleteLeavePending,
    openLeaveModal,
    openLeaveDeleteModal,
    saveLeave,
    deleteLeave,
  };
}

export function useTaskEvents() {
  const queryClient = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<TaskEvent | null>(null);
  const eventModal = useModalState();
  const eventDeleteModal = useModalState();
  const [deleteEventPending, setDeleteEventPending] = useState(false);
  const [filterTeam, setFilterTeam] = useState<boolean | undefined>(undefined);

  const eventsQuery = useQuery({
    queryKey: [...TASK_EVENTS_KEY, filterTeam],
    queryFn: () => taskApi.events.list(filterTeam),
  });

  const eventForm = useForm<EventInput>({
    resolver: zodResolver(eventInputSchema),
    defaultValues: {
      title: "",
      description: null,
      start_time: "",
      end_time: "",
      is_team_event: false,
    },
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: TASK_EVENTS_KEY });
  }

  function openEventModal(event?: TaskEvent) {
    setEditingEvent(event ?? null);
    eventForm.reset({
      title: event?.title ?? "",
      description: event?.description ?? null,
      start_time: event?.start_time ?? "",
      end_time: event?.end_time ?? "",
      is_team_event: event?.is_team_event ?? false,
    });
    eventModal.openModal();
  }

  function openEventDeleteModal(event: TaskEvent) {
    setEditingEvent(event);
    eventDeleteModal.openModal();
  }

  async function saveEvent(values: EventInput) {
    try {
      if (editingEvent) {
        await taskApi.events.update(editingEvent.id, values);
        toast.success("Event updated");
      } else {
        await taskApi.events.create(values);
        toast.success("Event created");
      }
      await invalidate();
      setEditingEvent(null);
      eventModal.closeModal();
      eventForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      throw error;
    }
  }

  async function deleteEvent() {
    if (!editingEvent) return;
    setDeleteEventPending(true);
    try {
      await taskApi.events.remove(editingEvent.id);
      await invalidate();
      toast.success("Event deleted");
      setEditingEvent(null);
      eventDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
      throw error;
    } finally {
      setDeleteEventPending(false);
    }
  }

  return {
    eventsQuery,
    eventForm,
    eventModal,
    eventDeleteModal,
    editingEvent,
    deleteEventPending,
    filterTeam,
    setFilterTeam,
    openEventModal,
    openEventDeleteModal,
    saveEvent,
    deleteEvent,
  };
}

const TEAM_USERS_KEY = ["team-users-list"] as const;
const TASK_ROUTINES_KEY = ["task-routines"] as const;
const TEAM_ALL_TODOS_KEY = ["team-all-todos"] as const;

export function useUsers() {
  return useQuery({
    queryKey: TEAM_USERS_KEY,
    queryFn: taskApi.users.list,
  });
}

export function useTeamTodos(userId?: string) {
  const queryClient = useQueryClient();
  const [editingTodo, setEditingTodo] = useState<TaskTodo | null>(null);
  const todoModal = useModalState();
  const todoDeleteModal = useModalState();
  const [deleteTodoPending, setDeleteTodoPending] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string | undefined>(undefined);

  const todosQuery = useQuery({
    queryKey: [...TEAM_ALL_TODOS_KEY, filterAssignee],
    queryFn: () => filterAssignee ? taskApi.todos.list(filterAssignee) : taskApi.todos.listAll(),
  });

  const archivedQuery = useQuery({
    queryKey: [...TEAM_ALL_TODOS_KEY, "archived"],
    queryFn: taskApi.todos.listArchived,
  });

  const todoForm = useForm<TodoInput>({
    resolver: zodResolver(todoInputSchema),
    defaultValues: {
      title: "",
      description: null,
      status: "backlog",
      priority: "medium",
      assignee_id: null,
      due_date: null,
    },
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TEAM_ALL_TODOS_KEY }),
      queryClient.invalidateQueries({ queryKey: TASK_TODOS_KEY }),
    ]);
  }

  function openTodoModal(todo?: TaskTodo) {
    setEditingTodo(todo ?? null);
    todoForm.reset({
      title: todo?.title ?? "",
      description: todo?.description ?? null,
      status: todo?.status ?? "backlog",
      priority: todo?.priority ?? "medium",
      assignee_id: todo?.assignee_id ?? null,
      due_date: todo?.due_date ?? null,
    });
    todoModal.openModal();
  }

  function openTodoDeleteModal(todo: TaskTodo) {
    setEditingTodo(todo);
    todoDeleteModal.openModal();
  }

  async function saveTodo(values: TodoInput) {
    try {
      if (editingTodo) {
        await taskApi.todos.update(editingTodo.id, values);
        toast.success("Task updated");
      } else {
        await taskApi.todos.create(values);
        toast.success("Task created");
      }
      await invalidate();
      setEditingTodo(null);
      todoModal.closeModal();
      todoForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      throw error;
    }
  }

  async function deleteTodo() {
    if (!editingTodo) return;
    setDeleteTodoPending(true);
    try {
      await taskApi.todos.remove(editingTodo.id);
      await invalidate();
      toast.success("Task deleted");
      setEditingTodo(null);
      todoDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
      throw error;
    } finally {
      setDeleteTodoPending(false);
    }
  }

  async function archiveTodo(todo: TaskTodo) {
    try {
      await taskApi.todos.archive(todo.id);
      await invalidate();
      toast.success("Task archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive");
    }
  }

  async function unarchiveTodo(id: string) {
    try {
      await taskApi.todos.unarchive(id);
      await invalidate();
      toast.success("Task restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore");
    }
  }

  return {
    todosQuery,
    archivedQuery,
    todoForm,
    todoModal,
    todoDeleteModal,
    editingTodo,
    deleteTodoPending,
    filterAssignee,
    setFilterAssignee,
    openTodoModal,
    openTodoDeleteModal,
    saveTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
  };
}

export function useTaskRoutines(userId: string) {
  const queryClient = useQueryClient();
  const [editingRoutine, setEditingRoutine] = useState<TaskRoutine | null>(null);
  const routineModal = useModalState();
  const routineDeleteModal = useModalState();
  const [deleteRoutinePending, setDeleteRoutinePending] = useState(false);

  const routinesQuery = useQuery({
    queryKey: [...TASK_ROUTINES_KEY, userId],
    queryFn: () => taskApi.routines.list(userId),
  });

  const routineForm = useForm<RoutineInput>({
    resolver: zodResolver(routineInputSchema),
    defaultValues: { title: "", description: null },
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: TASK_ROUTINES_KEY });
  }

  function openRoutineModal(routine?: TaskRoutine) {
    setEditingRoutine(routine ?? null);
    routineForm.reset({
      title: routine?.title ?? "",
      description: routine?.description ?? null,
    });
    routineModal.openModal();
  }

  function openRoutineDeleteModal(routine: TaskRoutine) {
    setEditingRoutine(routine);
    routineDeleteModal.openModal();
  }

  async function saveRoutine(values: RoutineInput) {
    try {
      if (editingRoutine) {
        await taskApi.routines.update(editingRoutine.id, values);
        toast.success("Rutinitas diupdate");
      } else {
        await taskApi.routines.create(values, userId);
        toast.success("Rutinitas ditambahkan");
      }
      await invalidate();
      setEditingRoutine(null);
      routineModal.closeModal();
      routineForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
      throw error;
    }
  }

  async function deleteRoutine() {
    if (!editingRoutine) return;
    setDeleteRoutinePending(true);
    try {
      await taskApi.routines.remove(editingRoutine.id);
      await invalidate();
      toast.success("Rutinitas dihapus");
      setEditingRoutine(null);
      routineDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
      throw error;
    } finally {
      setDeleteRoutinePending(false);
    }
  }

  async function toggleRoutine(id: string) {
    try {
      await taskApi.routines.toggle(id);
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal toggle");
    }
  }

  async function resetAllRoutines() {
    try {
      await taskApi.routines.resetAll(userId);
      await invalidate();
      toast.success("Semua rutinitas direset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal reset");
    }
  }

  return {
    routinesQuery,
    routineForm,
    routineModal,
    routineDeleteModal,
    editingRoutine,
    deleteRoutinePending,
    openRoutineModal,
    openRoutineDeleteModal,
    saveRoutine,
    deleteRoutine,
    toggleRoutine,
    resetAllRoutines,
  };
}

export function useTeamRoutines() {
  const queryClient = useQueryClient();
  const [editingRoutine, setEditingRoutine] = useState<TaskRoutine | null>(null);
  const routineModal = useModalState();
  const routineDeleteModal = useModalState();
  const [deleteRoutinePending, setDeleteRoutinePending] = useState(false);
  const [filterUser, setFilterUser] = useState<string | undefined>(undefined);

  const routinesQuery = useQuery({
    queryKey: [...TASK_ROUTINES_KEY, "team", filterUser],
    queryFn: () => filterUser ? taskApi.routines.list(filterUser) : taskApi.routines.list(undefined, true),
  });

  const routineForm = useForm<RoutineTeamInput>({
    resolver: zodResolver(routineTeamInputSchema),
    defaultValues: { title: "", description: null, user_id: "" },
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: TASK_ROUTINES_KEY });
  }

  function openRoutineModal(routine?: TaskRoutine) {
    setEditingRoutine(routine ?? null);
    routineForm.reset({
      title: routine?.title ?? "",
      description: routine?.description ?? null,
      user_id: routine?.user_id ?? "",
    });
    routineModal.openModal();
  }

  function openRoutineDeleteModal(routine: TaskRoutine) {
    setEditingRoutine(routine);
    routineDeleteModal.openModal();
  }

  async function saveRoutine(values: RoutineTeamInput) {
    try {
      if (editingRoutine) {
        await taskApi.routines.update(editingRoutine.id, values);
        toast.success("Rutinitas diupdate");
      } else {
        await taskApi.routines.create(values, values.user_id);
        toast.success("Rutinitas ditambahkan");
      }
      await invalidate();
      setEditingRoutine(null);
      routineModal.closeModal();
      routineForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
      throw error;
    }
  }

  async function deleteRoutine() {
    if (!editingRoutine) return;
    setDeleteRoutinePending(true);
    try {
      await taskApi.routines.remove(editingRoutine.id);
      await invalidate();
      toast.success("Rutinitas dihapus");
      setEditingRoutine(null);
      routineDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
      throw error;
    } finally {
      setDeleteRoutinePending(false);
    }
  }

  return {
    routinesQuery,
    routineForm,
    routineModal,
    routineDeleteModal,
    editingRoutine,
    deleteRoutinePending,
    filterUser,
    setFilterUser,
    openRoutineModal,
    openRoutineDeleteModal,
    saveRoutine,
    deleteRoutine,
  };
}

const TEAM_KPIS_KEY = ["team-kpis"] as const;

export function useTeamKpis() {
  const queryClient = useQueryClient();
  const [editingKpi, setEditingKpi] = useState<TaskKpi | null>(null);
  const kpiModal = useModalState();
  const kpiDeleteModal = useModalState();
  const [deleteKpiPending, setDeleteKpiPending] = useState(false);
  const [filterUser, setFilterUser] = useState<string | undefined>(undefined);

  const kpisQuery = useQuery({
    queryKey: [...TEAM_KPIS_KEY, filterUser],
    queryFn: () => filterUser ? taskApi.kpis.list(filterUser) : taskApi.kpis.list(undefined, true),
  });

  const kpiForm = useForm<KpiTeamInput>({
    resolver: zodResolver(kpiTeamInputSchema),
    defaultValues: {
      user_id: "",
      title: "",
      description: null,
      type: "maximize",
      bobot: 1,
      target_value: 0,
      unit: "",
      period_start: "",
      period_end: "",
      notes: null,
    },
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TEAM_KPIS_KEY }),
      queryClient.invalidateQueries({ queryKey: TASK_KPIS_KEY }),
    ]);
  }

  function openKpiModal(kpi?: TaskKpi) {
    setEditingKpi(kpi ?? null);
    kpiForm.reset({
      user_id: kpi?.user_id ?? "",
      title: kpi?.title ?? "",
      description: kpi?.description ?? null,
      type: kpi?.type ?? "maximize",
      bobot: kpi?.bobot ?? 1,
      target_value: kpi?.target_value ?? 0,
      unit: kpi?.unit ?? "",
      period_start: kpi?.period_start ?? "",
      period_end: kpi?.period_end ?? "",
      notes: kpi?.notes ?? null,
    });
    kpiModal.openModal();
  }

  function openKpiDeleteModal(kpi: TaskKpi) {
    setEditingKpi(kpi);
    kpiDeleteModal.openModal();
  }

  async function saveKpi(values: KpiTeamInput) {
    try {
      if (editingKpi) {
        await taskApi.kpis.update(editingKpi.id, values);
        toast.success("KPI diupdate");
      } else {
        await taskApi.kpis.create(values);
        toast.success("KPI ditambahkan");
      }
      await invalidate();
      setEditingKpi(null);
      kpiModal.closeModal();
      kpiForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan KPI");
      throw error;
    }
  }

  async function deleteKpi() {
    if (!editingKpi) return;
    setDeleteKpiPending(true);
    try {
      await taskApi.kpis.remove(editingKpi.id);
      await invalidate();
      toast.success("KPI dihapus");
      setEditingKpi(null);
      kpiDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
      throw error;
    } finally {
      setDeleteKpiPending(false);
    }
  }

  async function approveKpi(id: string) {
    try {
      await taskApi.kpis.approve(id);
      await invalidate();
      toast.success("KPI disetujui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal approve");
    }
  }

  async function rejectKpi(id: string) {
    try {
      await taskApi.kpis.reject(id);
      await invalidate();
      toast.success("KPI ditolak");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal reject");
    }
  }

  return {
    kpisQuery,
    kpiForm,
    kpiModal,
    kpiDeleteModal,
    editingKpi,
    deleteKpiPending,
    filterUser,
    setFilterUser,
    openKpiModal,
    openKpiDeleteModal,
    saveKpi,
    deleteKpi,
    approveKpi,
    rejectKpi,
  };
}