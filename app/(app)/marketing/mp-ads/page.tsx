import { PageShell } from "@/components/foundation/page-shell";
import { ModulePlaceholder } from "@/features/shared/module-hub";

export default function MarketingMpAdsPage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Iklan MP"
      description="Placeholder awal untuk monitoring iklan marketplace seperti biaya, hasil, dan efisiensi campaign."
    >
      <ModulePlaceholder
        intro="Halaman ini paling pas untuk menaruh spend, order attribution, ROAS, dan efektivitas campaign marketplace."
        focusItems={[
          "Biaya iklan per channel marketplace.",
          "ROAS, omzet attributed, dan efisiensi campaign.",
          "Campaign yang sehat vs campaign yang perlu dipangkas.",
        ]}
      />
    </PageShell>
  );
}
