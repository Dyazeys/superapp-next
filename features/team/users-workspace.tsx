"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, ShieldCheck, Trash2, UserCog, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricCard } from "@/components/layout/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamUserProfileModalContent } from "@/features/team/user-profile-workspace";
import { useTeamUsers } from "@/features/team/use-team-module";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";
import type { TeamUserRecord } from "@/types/team";

const columnHelper = createColumnHelper<TeamUserRecord>();

export function TeamUsersWorkspace() {
  const hooks = useTeamUsers();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];
  const canCreate = hasPermission(permissions, PERMISSIONS.AUTH_USER_CREATE);
  const canUpdate = hasPermission(permissions, PERMISSIONS.AUTH_USER_UPDATE);
  const canDelete = hasPermission(permissions, PERMISSIONS.AUTH_USER_DELETE);
  const payload = hooks.usersQuery.data;
  const users = payload?.users ?? [];
  const roles = payload?.roles ?? [];
  const activeUsers = users.filter((user) => user.is_active).length;
  const ownerUsers = users.filter((user) => user.roles?.role_name === "OWNER").length;

  const columns = [
    columnHelper.accessor("username", {
      header: "Username",
      cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor("full_name", {
      header: "Full name",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.display({
      id: "role",
      header: "Role",
      cell: ({ row }) => row.original.roles?.role_name ?? "UNASSIGNED",
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <Badge
          variant="outline"
          className={
            info.getValue()
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }
        >
          {info.getValue() ? "Active" : "Inactive"}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canUpdate || canDelete ? (
          <div className="flex justify-end gap-2">
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => hooks.openUserProfileModal(row.original)}
              aria-label={`Edit profile ${row.original.username}`}
            >
              <UserCog className="size-3.5" />
            </Button>
            {canUpdate ? (
              <Button size="icon-xs" variant="outline" onClick={() => hooks.openUserModal(row.original)} aria-label={`Edit ${row.original.username}`}>
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                size="icon-xs"
                variant="destructive"
                onClick={() => hooks.openUserDeleteModal(row.original)}
                aria-label={`Delete ${row.original.username}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null,
    }),
  ];

  return (
    <PageShell
      eyebrow="Team"
      title="Users"
      description="Kelola akun login internal, role assignment, dan status aktif user aplikasi."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          Gunakan tombol profile di tiap baris untuk mengelola identitas internal, avatar, bio, dan field profil lain milik user tersebut.
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total users" value={String(users.length)} subtitle="Jumlah akun login yang tercatat." icon={<UserRound className="size-4" />} />
          <MetricCard title="Active users" value={String(activeUsers)} subtitle="User yang masih bisa login." />
          <MetricCard title="Roles loaded" value={String(roles.length)} subtitle="Role yang tersedia untuk assignment." />
          <MetricCard title="Owners" value={String(ownerUsers)} subtitle="Jumlah user owner saat ini." icon={<ShieldCheck className="size-4" />} />
        </div>

        {canCreate ? (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openUserModal()}>
              <Plus className="size-4" />
              Add user
            </Button>
          </div>
        ) : null}

        <DataTable columns={columns} data={users} emptyMessage="No users yet." pagination={{ enabled: true, pageSize: 10 }} />
      </div>

      <ModalFormShell
        open={hooks.userModal.open}
        onOpenChange={hooks.userModal.setOpen}
        title={hooks.editingUser ? "Edit user" : "Create user"}
        description="Gunakan role bisnis yang sudah ada supaya akses UI dan API tetap konsisten."
        isSubmitting={hooks.userForm.formState.isSubmitting}
        onSubmit={() => hooks.userForm.handleSubmit((values) => hooks.saveUser(values))()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Username / email" htmlFor="team_user_username" error={hooks.userForm.formState.errors.username?.message}>
            <Input id="team_user_username" {...hooks.userForm.register("username")} />
          </FormField>
          <FormField label="Full name" htmlFor="team_user_full_name" error={hooks.userForm.formState.errors.full_name?.message}>
            <Input id="team_user_full_name" {...hooks.userForm.register("full_name")} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Role" htmlFor="team_user_role_id" error={hooks.userForm.formState.errors.role_id?.message}>
            <select
              id="team_user_role_id"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              value={String(hooks.userForm.watch("role_id") || "")}
              onChange={(event) => hooks.userForm.setValue("role_id", Number(event.target.value))}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status" htmlFor="team_user_is_active">
            <select
              id="team_user_is_active"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              value={String(hooks.userForm.watch("is_active"))}
              onChange={(event) => hooks.userForm.setValue("is_active", event.target.value === "true")}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </FormField>
        </div>

        <FormField
          label={hooks.editingUser ? "New password" : "Password"}
          htmlFor="team_user_password"
          helperText={hooks.editingUser ? "Leave blank to keep the current password." : "Minimal 8 karakter."}
          error={hooks.userForm.formState.errors.password?.message}
        >
          <Input id="team_user_password" type="password" {...hooks.userForm.register("password")} />
        </FormField>
      </ModalFormShell>

      <Dialog
        open={hooks.userProfileModal.open}
        onOpenChange={(open) => {
          hooks.userProfileModal.setOpen(open);
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 sm:max-w-[960px]">
          <DialogHeader>
            <DialogTitle>
              {hooks.profileUser?.full_name ? `Edit profile: ${hooks.profileUser.full_name}` : "Edit user profile"}
            </DialogTitle>
            <DialogDescription>
              Edit identitas internal user langsung dari Team Admin tanpa pindah halaman.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto bg-white py-5 pr-1 text-slate-900">
            {hooks.profileUser ? (
              <TeamUserProfileModalContent
                userId={hooks.profileUser.id}
                onSaved={() => hooks.userProfileModal.closeModal()}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={hooks.userDeleteModal.open}
        onOpenChange={(open) => {
          hooks.userDeleteModal.setOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              {hooks.deletingUser
                ? `Delete ${hooks.deletingUser.username}? This action cannot be undone.`
                : "Delete this user? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              variant="destructive"
              disabled={hooks.deleteUserPending}
              onClick={() => void hooks.deleteUser()}
            >
              {hooks.deleteUserPending ? "Deleting..." : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
