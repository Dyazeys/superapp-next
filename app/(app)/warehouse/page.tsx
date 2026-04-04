import { PageShell } from "@/components/foundation/page-shell";
import { WarehouseOverview } from "@/features/warehouse/warehouse-overview";

export default function WarehousePage() {
  return (
    <PageShell
      eyebrow="Warehouse"
      title="Warehouse module"
      description="Warehouse is now split into dedicated ERP sub-pages while preserving the existing schema, API surface, and stock-posting behavior."
    >
      <WarehouseOverview />
    </PageShell>
  );
}
