import { PageShell } from "@/components/foundation/page-shell";
import { FoundationWorkspace } from "@/features/foundation/foundation-workspace";

export default function WorkspacePage() {
  return (
    <PageShell
      eyebrow="Patterns"
      title="Reusable workspace foundations"
      description="This page demonstrates the generic table, modal, field, badge, and empty-state layers that future modules should adopt."
    >
      <FoundationWorkspace />
    </PageShell>
  );
}
