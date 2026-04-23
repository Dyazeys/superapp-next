import { PageShell } from "@/components/foundation/page-shell";
import { PayoutOverview } from "@/features/payout/payout-overview";

export default function PayoutPage() {
  return (
    <PageShell
      eyebrow="Payout"
      title="Modul Payout"
      description="Ringkasan modul payout untuk memantau payout, adjustment, transfer, dan nilai bersih berdasarkan data yang sudah ada."
    >
      <PayoutOverview />
    </PageShell>
  );
}
