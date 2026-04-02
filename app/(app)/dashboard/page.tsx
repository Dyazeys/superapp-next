import { CheckCircle2, Database, ShieldCheck, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FOUNDATION_CHECKLIST, FOUNDATION_PILLARS } from "@/lib/foundation-data";

const icons = {
  "Runtime providers": Sparkles,
  "Database access": Database,
  "UI primitives": ShieldCheck,
};

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Foundation"
      title="Production-style ERP base"
      description="This codebase is now structured around reusable runtime layers, a neutral workspace shell, and module-ready UI primitives."
    >
      <section className="grid gap-4 xl:grid-cols-3">
        {FOUNDATION_PILLARS.map((pillar) => {
          const Icon = icons[pillar.title as keyof typeof icons] ?? Sparkles;

          return (
            <WorkspacePanel key={pillar.title} title={pillar.title} description={pillar.description}>
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="size-5" />
                </div>
                <StatusBadge label={pillar.status} tone="success" />
              </div>
            </WorkspacePanel>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <WorkspacePanel
          title="Architecture direction"
          description="The shell and runtime layers are intentionally neutral so future modules can migrate independently."
        >
          <div className="space-y-3">
            {[
              "App shell separated from modules and views.",
              "Providers mounted once at the root: auth session, query client, and toasts.",
              "Database adapters isolated under db/, with typed env validation under schemas/.",
              "UI foundations built for tables, modal forms, fields, badges, and empty states.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Foundation checklist"
          description="What is complete before business modules start moving over."
        >
          <div className="space-y-3">
            {FOUNDATION_CHECKLIST.map(([label, state]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="text-sm">{label}</span>
                <StatusBadge
                  label={state === "done" ? "Done" : "Next"}
                  tone={state === "done" ? "success" : "info"}
                />
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </section>
    </PageShell>
  );
}
