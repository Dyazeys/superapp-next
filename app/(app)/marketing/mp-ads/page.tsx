import { PageShell } from "@/components/foundation/page-shell";
import { MpAdsWorkspace } from "@/features/marketing/mp-ads-workspace";

export default function MarketingMpAdsPage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Iklan MP"
      description="Data iklan marketplace harian."
    >
      <MpAdsWorkspace />
    </PageShell>
  );
}