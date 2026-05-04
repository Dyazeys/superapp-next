"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
import { getRoleDisplayName, PERMISSIONS, ROLE_CODES, SUPERADMIN_ROLE_CODE, SUPERADMIN_ROLE_LABEL, hasPermission } from "@/lib/rbac";
import { PermissionSelector } from "@/features/team/permission-selector";
import { useTeamRoles } from "@/features/team/use-team-module";
import type { RoleInput } from "@/schemas/team-module";
import type { TeamRoleRecord } from "@/types/team";

const columnHelper = createColumnHelper<TeamRoleRecord>();

export function TeamRolesWorkspace() {
  const hooks = useTeamRoles();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];
  const canCreate = hasPermission(permissions, PERMISSIONS.AUTH_ROLE_CREATE);
  const canUpdate = hasPermission(permissions, PERMISSIONS.AUTH_ROLE_UPDATE);
  const canDelete = hasPermission(permissions, PERMISSIONS.AUTH_ROLE_DELETE);
  const roles = hooks.rolesQuery.data ?? [];
  const totalUsersCovered = roles.reduce((sum, role) => sum + (role._count?.users ?? 0), 0);

  const columns = [
    columnHelper.accessor("role_name", {
      header: "Role",
      cell: (info) => <span className="font-medium text-slate-900">{getRoleDisplayName(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: "permission_count",
      header: "Permissions",
      cell: ({ row }) => row.original.permissions.length,
    }),
    columnHelper.display({
      id: "user_count",
      header: "Users",
      cell: ({ row }) => row.original._count?.users ?? 0,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canUpdate || canDelete ? (
          <div className="flex justify-end gap-2">
            {canUpdate ? (
              <Button size="icon-xs" variant="outline" onClick={() => hooks.openRoleModal(row.original)} aria-label={`Edit ${row.original.role_name}`}>
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                size="icon-xs"
                variant="destructive"
                onClick={() => hooks.openRoleDeleteModal(row.original)}
                aria-label={`Delete ${row.original.role_name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null,
    }),
  ];

  const currentPermissions = hooks.roleForm.watch("permissions") ?? [];

  return (
    <PageShell
      eyebrow="Team"
      title="Roles & Permissions"
      description="Atur role bisnis dan permission yang dipakai untuk guard menu, halaman, dan API."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total roles" value={String(roles.length)} subtitle="Role yang aktif di database." icon={<ShieldCheck className="size-4" />} />
          <MetricCard title="Mapped users" value={String(totalUsersCovered)} subtitle="Akumulasi user yang punya role." />
          <MetricCard title="Max permissions" value={String(Math.max(0, ...roles.map((role) => role.permissions.length)))} subtitle="Role dengan permission terbanyak." />
          <MetricCard title="Templates" value={String(ROLE_CODES.length)} subtitle="Template default yang kita pakai untuk seed." />
        </div>

        {canCreate ? (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openRoleModal()}>
              <Plus className="size-4" />
              Add role
            </Button>
          </div>
        ) : null}

        <DataTable columns={columns} data={roles} emptyMessage="No roles yet." pagination={{ enabled: true, pageSize: 10 }} />
      </div>

      <ModalFormShell
        open={hooks.roleModal.open}
        onOpenChange={hooks.roleModal.setOpen}
        title={hooks.editingRole ? "Edit role" : "Create role"}
        description="Pilih permission untuk role ini. Gunakan template untuk isi cepat, lalu sesuaikan dengan klik checkbox."
        dialogClassName="sm:max-w-[800px]"
        isSubmitting={hooks.roleForm.formState.isSubmitting}
        onSubmit={() =>
          hooks.roleForm.handleSubmit((values: RoleInput) =>
            hooks.saveRole({
              ...values,
              permissions: Array.from(new Set(values.permissions)).sort(),
            })
          )()
        }
      >
        <FormField label="Role name" htmlFor="team_role_name" error={hooks.roleForm.formState.errors.role_name?.message}>
          <Input id="team_role_name" {...hooks.roleForm.register("role_name")} />
        </FormField>

        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.02em] text-foreground/80">Quick templates</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_CODES.map((roleCode) => (
              <Button key={roleCode} type="button" size="sm" variant="outline" onClick={() => hooks.applyTemplate(roleCode)}>
                {roleCode === SUPERADMIN_ROLE_CODE ? SUPERADMIN_ROLE_LABEL : roleCode}
              </Button>
            ))}
          </div>
        </div>

        <FormField
          label="Permissions"
          htmlFor="team_role_permissions"
          error={hooks.roleForm.formState.errors.permissions?.message as string | undefined}
        >
          <PermissionSelector
            value={currentPermissions}
            onChange={(perms) =>
              hooks.roleForm.setValue("permissions", perms, { shouldDirty: true })
            }
          />
        </FormField>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">Total dipilih</p>
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              {currentPermissions.length} permissions
            </Badge>
          </div>
        </div>
      </ModalFormShell>

      <Dialog
        open={hooks.roleDeleteModal.open}
        onOpenChange={(open) => {
          hooks.roleDeleteModal.setOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              {hooks.deletingRole
                ? `Delete role ${hooks.deletingRole.role_name}? This action cannot be undone.`
                : "Delete this role? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              variant="destructive"
              disabled={hooks.deleteRolePending}
              onClick={() => void hooks.deleteRole()}
            >
              {hooks.deleteRolePending ? "Deleting..." : "Delete role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
