import { PageShell } from "@/components/foundation/page-shell";
import { SalesWorkspace } from "@/features/sales/sales-workspace";

export default function SalesPage() {
  return (
    <PageShell
      eyebrow="Sales"
      title="Sales module"
      description="Migrated Sales Orders and Sales Order Items onto the new stack while preserving existing stock-posting behavior through the warehouse movement ledger."
    >
      <SalesWorkspace />
    </PageShell>
  );
}
