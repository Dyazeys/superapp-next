import { PageShell } from "@/components/foundation/page-shell";
import { WarehouseWorkspace } from "@/features/warehouse/warehouse-workspace";

export default function WarehousePage() {
  return (
    <PageShell
      eyebrow="Warehouse"
      title="Warehouse module"
      description="Migrated Vendors, Purchase Orders, Inbound, Inbound Items, Stock Balances, and Adjustments onto the new stack while keeping the existing warehouse database behavior as the source of truth."
    >
      <WarehouseWorkspace />
    </PageShell>
  );
}
