import { requestJson } from "@/lib/request";
import type { RoleInput, UserCreateInput, UserUpdateInput } from "@/schemas/team-module";
import type { TeamUserProfileUpdateInput } from "@/schemas/profile";
import type { ProfilePayload } from "@/types/profile";
import type { TeamRoleRecord, TeamUserRecord, TeamUsersPayload } from "@/types/team";
import type {
  TeamMeeting,
  TeamMeetingTodo,
  TeamAnnouncement,
  ApprovalRequest,
  Department,
  DepartmentMember,
} from "@/types/task";
import type {
  MeetingInput,
  MeetingTodoInput,
  AnnouncementInput,
  DepartmentInput,
  DepartmentMemberInput,
} from "@/schemas/task-module";

export const teamApi = {
  users: {
    list: () => requestJson<TeamUsersPayload>("/api/team/users"),
    create: (payload: UserCreateInput) =>
      requestJson<TeamUserRecord>("/api/team/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (userId: string, payload: UserUpdateInput) =>
      requestJson<TeamUserRecord>(`/api/team/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (userId: string) =>
      requestJson<void>(`/api/team/users/${userId}`, {
        method: "DELETE",
      }),
    profile: {
      get: (userId: string) => requestJson<ProfilePayload>(`/api/team/users/${userId}/profile`),
      update: (userId: string, payload: TeamUserProfileUpdateInput) =>
        requestJson<ProfilePayload>(`/api/team/users/${userId}/profile`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
    },
  },
  roles: {
    list: () => requestJson<TeamRoleRecord[]>("/api/team/roles"),
    create: (payload: RoleInput) =>
      requestJson<TeamRoleRecord>("/api/team/roles", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (roleId: number, payload: RoleInput) =>
      requestJson<TeamRoleRecord>(`/api/team/roles/${roleId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (roleId: number) =>
      requestJson<void>(`/api/team/roles/${roleId}`, {
        method: "DELETE",
      }),
  },
  meetings: {
    list: () => requestJson<TeamMeeting[]>("/api/team/meetings"),
    create: (payload: MeetingInput) =>
      requestJson<TeamMeeting>("/api/team/meetings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<MeetingInput>) =>
      requestJson<TeamMeeting>(`/api/team/meetings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<void>(`/api/team/meetings/${id}`, { method: "DELETE" }),
  },
  meetingTodos: {
    list: (meetingId?: string) => {
      const params = new URLSearchParams();
      if (meetingId) params.set("meeting_id", meetingId);
      return requestJson<TeamMeetingTodo[]>(`/api/team/meeting-todos?${params}`);
    },
    create: (payload: MeetingTodoInput) =>
      requestJson<TeamMeetingTodo>("/api/team/meeting-todos", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<MeetingTodoInput>) =>
      requestJson<TeamMeetingTodo>(`/api/team/meeting-todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<void>(`/api/team/meeting-todos/${id}`, { method: "DELETE" }),
  },
  announcements: {
    list: () => requestJson<TeamAnnouncement[]>("/api/team/announcements"),
    create: (payload: AnnouncementInput) =>
      requestJson<TeamAnnouncement>("/api/team/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<AnnouncementInput>) =>
      requestJson<TeamAnnouncement>(`/api/team/announcements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<void>(`/api/team/announcements/${id}`, { method: "DELETE" }),
    publish: (id: string) =>
      requestJson<TeamAnnouncement>(`/api/team/announcements/${id}/publish`, {
        method: "PATCH",
      }),
    togglePin: (id: string) =>
      requestJson<TeamAnnouncement>(`/api/team/announcements/${id}/pin`, {
        method: "PATCH",
      }),
  },
  approvals: {
    list: (params?: { status?: string; type?: string }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set("status", params.status);
      if (params?.type) search.set("type", params.type);
      return requestJson<ApprovalRequest[]>(`/api/team/approvals?${search}`);
    },
    detail: (id: string) =>
      requestJson<ApprovalRequest & { domainDetail: Record<string, unknown> }>(`/api/team/approvals/${id}`),
    approve: (id: string, note?: string) =>
      requestJson<ApprovalRequest>(`/api/team/approvals/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ decision_note: note ?? null }),
      }),
    reject: (id: string, note?: string) =>
      requestJson<ApprovalRequest>(`/api/team/approvals/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ decision_note: note ?? null }),
      }),
    acknowledge: (id: string, note?: string) =>
      requestJson<ApprovalRequest>(`/api/team/approvals/${id}/acknowledge`, {
        method: "PATCH",
        body: JSON.stringify({ decision_note: note ?? null }),
      }),
  },
  departments: {
    list: () =>
      requestJson<{ departments: Department[]; members: DepartmentMember[] }>(
        "/api/team/departments"
      ),
    create: (payload: DepartmentInput) =>
      requestJson<Department>("/api/team/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<DepartmentInput>) =>
      requestJson<Department>(`/api/team/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      requestJson<void>(`/api/team/departments/${id}`, { method: "DELETE" }),
    members: {
      add: (departmentId: string, payload: DepartmentMemberInput) =>
        requestJson<DepartmentMember>(`/api/team/departments/${departmentId}/members`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      remove: (departmentId: string, userId: string) =>
        requestJson<void>(`/api/team/departments/${departmentId}/members/${userId}`, {
          method: "DELETE",
        }),
    },
  },
};
