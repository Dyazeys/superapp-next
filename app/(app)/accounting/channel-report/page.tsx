import { PageShell } from "@/components/foundation/page-shell";
import { AccountingChannelReport } from "@/features/accounting/accounting-channel-report";

export default function AccountingChannelReportPage() {
  return (
    <PageShell
      eyebrow="Accounting"
      title="Channel Report"
      description="Ringkasan accounting per channel berbasis jurnal yang sudah ada: sales posted, payout posted, saldo, transfer bank, outstanding, dan status."
    >
      <AccountingChannelReport />
    </PageShell>
  );
}
