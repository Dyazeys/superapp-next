import { requestJson } from "@/lib/request";
import type {
  TaskTodo,
  TaskKpi,
  TaskAttendance,
  TaskLeaveRequest,
  TaskEvent,
  TaskRoutine,
  UserBrief,
} from "@/types/task";
import type {
  TodoInput,
  KpiInput,
  KpiTeamInput,
  LeaveRequestInput,
  EventInput,
  RoutineInput,
} from "@/schemas/task-module";

export const taskApi = {
  users: {
    list: (): Promise<UserBrief[]> =>
      requestJson<UserBrief[]>("/api/team/users").then((r: unknown) => {
        const data = r as { users?: UserBrief[] };
        return data.users ?? (r as UserBrief[]);
      }),
  },
  todos: {
    list: (userId?: string): Promise<TaskTodo[]> => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      return requestJson<TaskTodo[]>(`/api/task/todos?${params}`);
    },
    listAll: (): Promise<TaskTodo[]> =>
      requestJson<TaskTodo[]>("/api/task/todos?archived=false"),
    listArchived: (): Promise<TaskTodo[]> =>
      requestJson<TaskTodo[]>("/api/task/todos?archived=true"),
    create: (payload: TodoInput, creatorId?: string): Promise<TaskTodo> =>
      requestJson<TaskTodo>(`/api/task/todos${creatorId ? `?userId=${creatorId}` : ""}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Record<string, unknown>): Promise<TaskTodo> =>
      requestJson<TaskTodo>(`/api/task/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string): Promise<void> =>
      requestJson<void>(`/api/task/todos/${id}`, { method: "DELETE" }),
    archive: (id: string): Promise<TaskTodo> =>
      requestJson<TaskTodo>(`/api/task/todos/${id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      }),
    unarchive: (id: string): Promise<TaskTodo> =>
      requestJson<TaskTodo>(`/api/task/todos/${id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived: false }),
      }),
  },
  kpis: {
    list: (userId?: string): Promise<TaskKpi[]> => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      return requestJson<TaskKpi[]>(`/api/task/kpis?${params}`);
    },
    create: (payload: KpiTeamInput): Promise<TaskKpi> =>
      requestJson<TaskKpi>("/api/task/kpis", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<KpiInput> & { user_id?: string }): Promise<TaskKpi> =>
      requestJson<TaskKpi>(`/api/task/kpis/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string): Promise<void> =>
      requestJson<void>(`/api/task/kpis/${id}`, { method: "DELETE" }),
    updateRealization: (id: string, value: number): Promise<TaskKpi> =>
      requestJson<TaskKpi>(`/api/task/kpis/${id}/realization`, {
        method: "PATCH",
        body: JSON.stringify({ realization_value: value }),
      }),
    approve: (id: string): Promise<TaskKpi> =>
      requestJson<TaskKpi>(`/api/task/kpis/${id}/approve`, { method: "PATCH" }),
    reject: (id: string): Promise<TaskKpi> =>
      requestJson<TaskKpi>(`/api/task/kpis/${id}/reject`, { method: "PATCH" }),
  },
  attendance: {
    today: (): Promise<TaskAttendance | null> =>
      requestJson<TaskAttendance | null>("/api/task/attendances/today"),
    list: (): Promise<TaskAttendance[]> =>
      requestJson<TaskAttendance[]>("/api/task/attendances"),
    clockIn: (): Promise<TaskAttendance> =>
      requestJson<TaskAttendance>("/api/task/attendances/clock-in", { method: "POST" }),
    clockOut: (): Promise<TaskAttendance> =>
      requestJson<TaskAttendance>("/api/task/attendances/clock-out", { method: "POST" }),
  },
  leaveRequests: {
    list: (): Promise<TaskLeaveRequest[]> =>
      requestJson<TaskLeaveRequest[]>("/api/task/leave-requests"),
    create: (payload: LeaveRequestInput): Promise<TaskLeaveRequest> =>
      requestJson<TaskLeaveRequest>("/api/task/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<LeaveRequestInput>): Promise<TaskLeaveRequest> =>
      requestJson<TaskLeaveRequest>(`/api/task/leave-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string): Promise<void> =>
      requestJson<void>(`/api/task/leave-requests/${id}`, { method: "DELETE" }),
    leaderApprove: (id: string, approvedBy: string): Promise<TaskLeaveRequest> =>
      requestJson<TaskLeaveRequest>(`/api/task/leave-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "leader_approved", leader_approved_by: approvedBy }),
      }),
    leaderReject: (id: string): Promise<TaskLeaveRequest> =>
      requestJson<TaskLeaveRequest>(`/api/task/leave-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      }),
    managerAcknowledge: (id: string, acknowledgedBy: string): Promise<TaskLeaveRequest> =>
      requestJson<TaskLeaveRequest>(`/api/task/leave-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "manager_acknowledged", manager_acknowledged_by: acknowledgedBy }),
      }),
  },
  events: {
    list: (isTeamEvent?: boolean): Promise<TaskEvent[]> => {
      const params = new URLSearchParams();
      if (isTeamEvent !== undefined) params.set("filterTeam", String(isTeamEvent));
      return requestJson<TaskEvent[]>(`/api/task/events?${params}`);
    },
    create: (payload: EventInput): Promise<TaskEvent> =>
      requestJson<TaskEvent>("/api/task/events", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: EventInput): Promise<TaskEvent> =>
      requestJson<TaskEvent>(`/api/task/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string): Promise<void> =>
      requestJson<void>(`/api/task/events/${id}`, { method: "DELETE" }),
  },
  routines: {
    list: (userId?: string): Promise<TaskRoutine[]> => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      return requestJson<TaskRoutine[]>(`/api/task/routines?${params}`);
    },
    create: (payload: RoutineInput, userId: string): Promise<TaskRoutine> =>
      requestJson<TaskRoutine>(`/api/task/routines?userId=${userId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    toggle: (id: string): Promise<void> =>
      requestJson<void>(`/api/task/routines/${id}/toggle`, { method: "PATCH" }),
    update: (id: string, payload: Partial<RoutineInput> & { user_id?: string }): Promise<TaskRoutine> =>
      requestJson<TaskRoutine>(`/api/task/routines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string): Promise<void> =>
      requestJson<void>(`/api/task/routines/${id}`, { method: "DELETE" }),
    resetAll: (userId: string): Promise<void> =>
      requestJson<void>(`/api/task/routines/reset-all?userId=${userId}`, { method: "POST" }),
  },
};
