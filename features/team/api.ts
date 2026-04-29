import { requestJson } from "@/lib/request";
import type { RoleInput, UserCreateInput, UserUpdateInput } from "@/schemas/team-module";
import type { TeamUserProfileUpdateInput } from "@/schemas/profile";
import type { ProfilePayload } from "@/types/profile";
import type { TeamRoleRecord, TeamUserRecord, TeamUsersPayload } from "@/types/team";

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
};
