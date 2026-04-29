"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { teamApi } from "@/features/team/api";
import { useModalState } from "@/hooks/use-modal-state";
import { ROLE_PERMISSION_TEMPLATES, type RoleCode } from "@/lib/rbac";
import {
  DEFAULT_PROFILE_LOCALE,
  DEFAULT_PROFILE_TIMEZONE,
  teamUserProfileUpdateSchema,
  type TeamUserProfileUpdateInput,
  type TeamUserProfileUpdatePayload,
} from "@/schemas/profile";
import {
  roleInputSchema,
  userUpdateSchema,
  type RoleInput,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/schemas/team-module";
import type { TeamRoleRecord, TeamUserRecord } from "@/types/team";

const TEAM_USERS_KEY = ["team-users"] as const;
const TEAM_ROLES_KEY = ["team-roles"] as const;

type UserFormValues = {
  username: string;
  full_name: string;
  role_id: number;
  password?: string;
  is_active: boolean;
};

const teamUserProfileKey = (userId: string) => ["team-user-profile", userId] as const;

export function useTeamUsers() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<TeamUserRecord | null>(null);
  const [profileUser, setProfileUser] = useState<TeamUserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<TeamUserRecord | null>(null);
  const [deleteUserPending, setDeleteUserPending] = useState(false);
  const userModal = useModalState();
  const userProfileModal = useModalState();
  const userDeleteModal = useModalState();
  const usersQuery = useQuery({
    queryKey: TEAM_USERS_KEY,
    queryFn: teamApi.users.list,
  });
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      username: "",
      full_name: "",
      role_id: 0,
      password: "",
      is_active: true,
    },
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TEAM_USERS_KEY }),
      queryClient.invalidateQueries({ queryKey: TEAM_ROLES_KEY }),
    ]);
  }

  function openUserModal(user?: TeamUserRecord) {
    setEditingUser(user ?? null);
    userForm.reset({
      username: user?.username ?? "",
      full_name: user?.full_name ?? "",
      role_id: user?.roles?.id ?? 0,
      password: "",
      is_active: user?.is_active ?? true,
    });
    userModal.openModal();
  }

  function openUserDeleteModal(user: TeamUserRecord) {
    setDeletingUser(user);
    userDeleteModal.openModal();
  }

  function openUserProfileModal(user: TeamUserRecord) {
    setProfileUser(user);
    userProfileModal.openModal();
  }

  async function saveUser(values: UserFormValues) {
    try {
      const normalizedPassword = values.password?.trim() ?? "";
      if (editingUser) {
        const payload: UserUpdateInput = {
          username: values.username,
          full_name: values.full_name,
          role_id: values.role_id,
          password: normalizedPassword ? normalizedPassword : undefined,
          is_active: values.is_active,
        };
        await teamApi.users.update(editingUser.id, payload);
        toast.success("User updated");
      } else {
        if (!normalizedPassword) {
          throw new Error("Password is required for a new user.");
        }

        const payload: UserCreateInput = {
          username: values.username,
          full_name: values.full_name,
          role_id: values.role_id,
          password: normalizedPassword,
          is_active: values.is_active,
        };
        await teamApi.users.create(payload);
        toast.success("User created");
      }

      await invalidate();
      setEditingUser(null);
      userModal.closeModal();
      userForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save user");
      throw error;
    }
  }

  async function deleteUser() {
    if (!deletingUser) return;

    setDeleteUserPending(true);
    try {
      await teamApi.users.remove(deletingUser.id);
      await invalidate();
      toast.success("User deleted");
      setDeletingUser(null);
      userDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
      throw error;
    } finally {
      setDeleteUserPending(false);
    }
  }

  return {
    usersQuery,
    userForm,
    userModal,
    userProfileModal,
    userDeleteModal,
    editingUser,
    profileUser,
    deletingUser,
    deleteUserPending,
    openUserModal,
    openUserProfileModal,
    openUserDeleteModal,
    saveUser,
    deleteUser,
  };
}

export function useTeamRoles() {
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<TeamRoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<TeamRoleRecord | null>(null);
  const [deleteRolePending, setDeleteRolePending] = useState(false);
  const roleModal = useModalState();
  const roleDeleteModal = useModalState();
  const rolesQuery = useQuery({
    queryKey: TEAM_ROLES_KEY,
    queryFn: teamApi.roles.list,
  });
  const roleForm = useForm<RoleInput>({
    resolver: zodResolver(roleInputSchema),
    defaultValues: {
      role_name: "",
      permissions: [],
    },
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TEAM_ROLES_KEY }),
      queryClient.invalidateQueries({ queryKey: TEAM_USERS_KEY }),
    ]);
  }

  function openRoleModal(role?: TeamRoleRecord) {
    setEditingRole(role ?? null);
    roleForm.reset({
      role_name: role?.role_name ?? "",
      permissions: role?.permissions ?? [],
    });
    roleModal.openModal();
  }

  function openRoleDeleteModal(role: TeamRoleRecord) {
    setDeletingRole(role);
    roleDeleteModal.openModal();
  }

  function applyTemplate(roleCode: RoleCode) {
    roleForm.setValue("role_name", roleCode);
    roleForm.setValue("permissions", ROLE_PERMISSION_TEMPLATES[roleCode]);
  }

  async function saveRole(values: RoleInput) {
    try {
      if (editingRole) {
        await teamApi.roles.update(editingRole.id, values);
        toast.success("Role updated");
      } else {
        await teamApi.roles.create(values);
        toast.success("Role created");
      }

      await invalidate();
      setEditingRole(null);
      roleModal.closeModal();
      roleForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save role");
      throw error;
    }
  }

  async function deleteRole() {
    if (!deletingRole) return;

    setDeleteRolePending(true);
    try {
      await teamApi.roles.remove(deletingRole.id);
      await invalidate();
      toast.success("Role deleted");
      setDeletingRole(null);
      roleDeleteModal.closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete role");
      throw error;
    } finally {
      setDeleteRolePending(false);
    }
  }

  return {
    rolesQuery,
    roleForm,
    roleModal,
    roleDeleteModal,
    editingRole,
    deletingRole,
    deleteRolePending,
    openRoleModal,
    openRoleDeleteModal,
    applyTemplate,
    saveRole,
    deleteRole,
  };
}

export function useTeamUserProfile(userId: string) {
  const profileQuery = useQuery({
    queryKey: teamUserProfileKey(userId),
    queryFn: () => teamApi.users.profile.get(userId),
  });

  const form = useForm<TeamUserProfileUpdateInput, undefined, TeamUserProfileUpdatePayload>({
    resolver: zodResolver(teamUserProfileUpdateSchema),
    defaultValues: {
      full_name: "",
      display_name: "",
      phone: "",
      avatar_url: "",
      job_title: "",
      department: "",
      timezone: DEFAULT_PROFILE_TIMEZONE,
      locale: DEFAULT_PROFILE_LOCALE,
      bio: "",
    },
  });

  useEffect(() => {
    const payload = profileQuery.data;
    if (!payload) return;

    form.reset({
      full_name: payload.user.full_name ?? "",
      display_name: payload.profile?.display_name ?? "",
      phone: payload.profile?.phone ?? "",
      avatar_url: payload.profile?.avatar_url ?? "",
      job_title: payload.profile?.job_title ?? "",
      department: payload.profile?.department ?? "",
      timezone: payload.profile?.timezone ?? DEFAULT_PROFILE_TIMEZONE,
      locale: payload.profile?.locale ?? DEFAULT_PROFILE_LOCALE,
      bio: payload.profile?.bio ?? "",
    });
  }, [form, profileQuery.data]);

  async function save(values: TeamUserProfileUpdatePayload) {
    try {
      const payload = await teamApi.users.profile.update(userId, values);
      form.reset({
        full_name: payload.user.full_name ?? "",
        display_name: payload.profile?.display_name ?? "",
        phone: payload.profile?.phone ?? "",
        avatar_url: payload.profile?.avatar_url ?? "",
        job_title: payload.profile?.job_title ?? "",
        department: payload.profile?.department ?? "",
        timezone: payload.profile?.timezone ?? DEFAULT_PROFILE_TIMEZONE,
        locale: payload.profile?.locale ?? DEFAULT_PROFILE_LOCALE,
        bio: payload.profile?.bio ?? "",
      });
      await profileQuery.refetch();
      toast.success("User profile updated");
      return payload;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user profile");
      throw error;
    }
  }

  return {
    profileQuery,
    form,
    save,
  };
}
