import { PageShell } from "@/components/foundation/page-shell";
import { WarehouseOverview } from "@/features/warehouse/warehouse-overview";

export default function WarehousePage() {
  return (
    <PageShell
      eyebrow="Warehouse"
      title="Warehouse module"
      description="Ringkasan modul Warehouse untuk operasional harian: inbound, pergerakan stok, dan saldo persediaan."
    >
      <WarehouseOverview />
    </PageShell>
  );
}
