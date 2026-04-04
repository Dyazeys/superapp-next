import { PageShell } from "@/components/foundation/page-shell";
import { SalesOverview } from "@/features/sales/sales-overview";

export default function SalesPage() {
  return (
    <PageShell
      eyebrow="Sales"
      title="Sales module"
      description="Ringkasan modul Sales untuk alur pesanan dan item tanpa mengubah proses bisnis yang sudah ada."
    >
      <SalesOverview />
    </PageShell>
  );
}
