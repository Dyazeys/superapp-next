import { PageShell } from "@/components/foundation/page-shell";
import { PayoutOverview } from "@/features/payout/payout-overview";

export default function PayoutPage() {
  return (
    <PageShell
      eyebrow="Payout"
      title="Payout module"
      description="Payout is split into ERP sub-pages over the existing payout records and payout adjustments schema with no new automation."
    >
      <PayoutOverview />
    </PageShell>
  );
}
