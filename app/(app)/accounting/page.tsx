import { PageShell } from "@/components/foundation/page-shell";
import { AccountingOverview } from "@/features/accounting/accounting-overview";

export default function AccountingPage() {
  return (
    <PageShell
      eyebrow="Accounting"
      title="Accounting module"
      description="Accounting is introduced as a read-first ERP module over the existing journal and chart-of-accounts data."
    >
      <AccountingOverview />
    </PageShell>
  );
}
