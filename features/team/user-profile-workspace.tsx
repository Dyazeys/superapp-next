"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock3, Save, UserRound } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTeamUserProfile } from "@/features/team/use-team-module";

type TeamUserProfileWorkspaceProps = {
  userId: string;
};

type TeamUserProfileEditorProps = TeamUserProfileWorkspaceProps & {
  compact?: boolean;
  onSaved?: () => void;
};

function TeamUserProfileEditor({ userId, compact = false, onSaved }: TeamUserProfileEditorProps) {
  const hooks = useTeamUserProfile(userId);
  const payload = hooks.profileQuery.data;
  const createdAt = payload?.user.created_at
    ? new Date(payload.user.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })
    : "-";

  const formContent = (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void hooks.form.handleSubmit((values) => hooks.save(values).then(() => onSaved?.()))();
      }}
    >
      {!compact ? (
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Username" value={payload?.user.username ?? "-"} subtitle="Identity login akun ini." icon={<UserRound className="size-4" />} />
          <MetricCard title="Role" value={payload?.user.role_name ?? "UNASSIGNED"} subtitle="Role utama untuk permission aplikasi." />
          <MetricCard title="Status" value={payload?.user.is_active ? "Active" : "Inactive"} subtitle="Status akun login saat ini." icon={<BadgeCheck className="size-4" />} />
          <MetricCard title="Joined" value={createdAt} subtitle="Tanggal akun ini dibuat." icon={<Clock3 className="size-4" />} />
        </div>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Username</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{payload?.user.username ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{payload?.user.role_name ?? "UNASSIGNED"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{payload?.user.is_active ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Joined</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{createdAt}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Username / email" htmlFor="team_profile_username" helperText="Disimpan di auth.users dan saat ini read-only dari halaman profile.">
          <Input id="team_profile_username" value={payload?.user.username ?? ""} disabled readOnly />
        </FormField>
        <FormField label="Full name" htmlFor="team_profile_full_name" error={hooks.form.formState.errors.full_name?.message}>
          <Input id="team_profile_full_name" {...hooks.form.register("full_name")} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Display name" htmlFor="team_profile_display_name" error={hooks.form.formState.errors.display_name?.message}>
          <Input id="team_profile_display_name" {...hooks.form.register("display_name")} />
        </FormField>
        <FormField label="Phone" htmlFor="team_profile_phone" error={hooks.form.formState.errors.phone?.message}>
          <Input id="team_profile_phone" {...hooks.form.register("phone")} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Job title" htmlFor="team_profile_job_title" error={hooks.form.formState.errors.job_title?.message}>
          <Input id="team_profile_job_title" {...hooks.form.register("job_title")} />
        </FormField>
        <FormField label="Department" htmlFor="team_profile_department" error={hooks.form.formState.errors.department?.message}>
          <Input id="team_profile_department" {...hooks.form.register("department")} />
        </FormField>
      </div>

      <FormField label="Avatar URL" htmlFor="team_profile_avatar_url" error={hooks.form.formState.errors.avatar_url?.message}>
        <Input id="team_profile_avatar_url" placeholder="https://..." {...hooks.form.register("avatar_url")} />
      </FormField>

      <FormField label="Bio" htmlFor="team_profile_bio" error={hooks.form.formState.errors.bio?.message}>
        <Textarea id="team_profile_bio" rows={4} {...hooks.form.register("bio")} />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" disabled={hooks.profileQuery.isLoading || hooks.form.formState.isSubmitting}>
          <Save className="size-4" />
          {hooks.form.formState.isSubmitting ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );

  if (compact) {
    return formContent;
  }

  return (
    <PageShell
      eyebrow="Team Admin"
      title={payload?.user.full_name ? `Profile: ${payload.user.full_name}` : "Edit user profile"}
      description="Halaman ini dipakai admin untuk mengelola detail profil user lain tanpa perlu login sebagai user tersebut."
      actions={
        <Link
          href="/team/users"
          className="inline-flex h-8 items-center gap-2 rounded-[min(var(--radius-md),12px)] border border-slate-300 bg-white px-3 text-[0.8rem] font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="size-3.5" />
          Back to users
        </Link>
      }
    >
      <WorkspacePanel
        title="User profile settings"
        description="Field di bawah ini menyimpan identitas internal user pada auth.users dan auth.user_profiles."
      >
        {formContent}
      </WorkspacePanel>
    </PageShell>
  );
}

export function TeamUserProfileWorkspace({ userId }: TeamUserProfileWorkspaceProps) {
  return <TeamUserProfileEditor userId={userId} />;
}

export function TeamUserProfileModalContent({
  userId,
  onSaved,
}: TeamUserProfileWorkspaceProps & { onSaved?: () => void }) {
  return <TeamUserProfileEditor userId={userId} compact onSaved={onSaved} />;
}
