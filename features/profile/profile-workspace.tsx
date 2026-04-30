"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfileModule } from "@/features/profile/use-profile-module";
import { getRoleDisplayName } from "@/lib/rbac";

type ProfileEditorContentProps = {
  compact?: boolean;
  onSaved?: () => void;
};

function ProfileEditorContent({ compact = false, onSaved }: ProfileEditorContentProps) {
  const hooks = useProfileModule();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const payload = hooks.profileQuery.data;
  const createdAt = payload?.user.created_at
    ? new Date(payload.user.created_at).toLocaleDateString("id-ID", {
        dateStyle: "medium",
      })
    : "-";

  return (
    <div className="space-y-5">
      {!compact ? (
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Username" value={payload?.user.username ?? "-"} subtitle="Identity login yang aktif sekarang." />
          <MetricCard title="Role" value={getRoleDisplayName(payload?.user.role_name)} subtitle="Role utama yang mengatur permission aplikasi." />
          <MetricCard title="Status" value={payload?.user.is_active ? "Active" : "Inactive"} subtitle="Status akun login di auth.users." />
          <MetricCard title="Joined" value={createdAt} subtitle="Tanggal akun ini dibuat." />
        </div>
      ) : null}

      <div className={compact ? "space-y-5" : undefined}>
        {compact ? (
          <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Username</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{payload?.user.username ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{getRoleDisplayName(payload?.user.role_name)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Joined</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{createdAt}</p>
            </div>
          </div>
        ) : null}

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void hooks.form.handleSubmit((values) => {
              return hooks.save(values).then(async (nextPayload) => {
                startTransition(() => {
                  void update({
                    user: {
                      name: nextPayload.user.full_name ?? nextPayload.user.username,
                    },
                  });
                });
                onSaved?.();
              });
            })();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Username / email" htmlFor="profile_username" helperText="Disimpan di auth.users dan saat ini read-only.">
              <Input id="profile_username" value={payload?.user.username ?? ""} disabled readOnly />
            </FormField>
            <FormField label="Full name" htmlFor="profile_full_name" error={hooks.form.formState.errors.full_name?.message}>
              <Input id="profile_full_name" {...hooks.form.register("full_name")} />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Display name" htmlFor="profile_display_name" error={hooks.form.formState.errors.display_name?.message}>
              <Input id="profile_display_name" {...hooks.form.register("display_name")} />
            </FormField>
            <FormField label="Phone" htmlFor="profile_phone" error={hooks.form.formState.errors.phone?.message}>
              <Input id="profile_phone" {...hooks.form.register("phone")} />
            </FormField>
            <FormField label="Job title" htmlFor="profile_job_title" error={hooks.form.formState.errors.job_title?.message}>
              <Input id="profile_job_title" {...hooks.form.register("job_title")} />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Department" htmlFor="profile_department" error={hooks.form.formState.errors.department?.message}>
              <Input id="profile_department" {...hooks.form.register("department")} />
            </FormField>
            <div />
          </div>

          <FormField label="Avatar URL" htmlFor="profile_avatar_url" error={hooks.form.formState.errors.avatar_url?.message}>
            <Input id="profile_avatar_url" placeholder="https://..." {...hooks.form.register("avatar_url")} />
          </FormField>

          <FormField label="Bio" htmlFor="profile_bio" error={hooks.form.formState.errors.bio?.message}>
            <Textarea id="profile_bio" rows={4} {...hooks.form.register("bio")} />
          </FormField>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-900">Change password</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Isi bagian ini hanya kalau memang ingin mengganti password akun yang sedang dipakai.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Current password" htmlFor="profile_current_password" error={hooks.form.formState.errors.current_password?.message}>
                <Input id="profile_current_password" type="password" {...hooks.form.register("current_password")} />
              </FormField>
              <FormField label="New password" htmlFor="profile_new_password" error={hooks.form.formState.errors.new_password?.message}>
                <Input id="profile_new_password" type="password" {...hooks.form.register("new_password")} />
              </FormField>
              <FormField label="Confirm password" htmlFor="profile_confirm_new_password" error={hooks.form.formState.errors.confirm_new_password?.message}>
                <Input id="profile_confirm_new_password" type="password" {...hooks.form.register("confirm_new_password")} />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={hooks.profileQuery.isLoading || hooks.form.formState.isSubmitting || isPending}>
              {hooks.form.formState.isSubmitting || isPending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProfileWorkspace() {
  return (
    <PageShell
      eyebrow="Profile"
      title="Edit Profile"
      description="Kelola identitas akun, info kontak internal, dan password untuk user yang sedang login."
    >
      <WorkspacePanel title="Profile settings" description="Field ini disimpan ke auth.users dan auth.user_profiles untuk kebutuhan identitas akun.">
        <ProfileEditorContent />
      </WorkspacePanel>
    </PageShell>
  );
}

export function ProfileEditorModalContent({ onSaved }: { onSaved?: () => void }) {
  return <ProfileEditorContent compact onSaved={onSaved} />;
}
