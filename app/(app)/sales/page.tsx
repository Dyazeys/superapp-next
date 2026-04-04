import { PageShell } from "@/components/foundation/page-shell";
import { SalesOverview } from "@/features/sales/sales-overview";

export default function SalesPage() {
  return (
    <PageShell
      eyebrow="Sales"
      title="Sales module"
      description="Sales is now split into dedicated ERP sub-pages while preserving the existing stock-posting and accounting-connected business logic."
    >
      <SalesOverview />
    </PageShell>
  );
}
