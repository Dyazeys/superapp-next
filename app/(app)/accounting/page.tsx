import { PageShell } from "@/components/foundation/page-shell";
import { AccountingOverview } from "@/features/accounting/accounting-overview";

export default function AccountingPage() {
  return (
    <PageShell
      eyebrow="Accounting"
      title="Accounting module"
      description="Ringkasan modul Accounting (read-first) untuk melihat COA, jurnal, dan detail entry dari data yang sudah ada."
    >
      <AccountingOverview />
    </PageShell>
  );
}
