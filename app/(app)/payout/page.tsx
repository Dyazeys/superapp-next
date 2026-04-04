import { PageShell } from "@/components/foundation/page-shell";
import { PayoutOverview } from "@/features/payout/payout-overview";

export default function PayoutPage() {
  return (
    <PageShell
      eyebrow="Payout"
      title="Payout module"
      description="Ringkasan modul Payout untuk monitoring payout, adjustment, dan nilai bersih berdasarkan data yang sudah ada."
    >
      <PayoutOverview />
    </PageShell>
  );
}
