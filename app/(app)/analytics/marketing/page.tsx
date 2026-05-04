import { Store, Music } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireAuth } from "@/lib/authz";
import { hasAnyPermission, PERMISSIONS } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AnalyticsMarketingPage() {
  const session = await requireAuth();

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.MARKETING_WORKSPACE_VIEW,
    ])
  ) {
    redirect("/analytics");
  }

  return (
    <PageShell
      eyebrow="Analytic"
      title="Marketing"
      description="Visualisasi data marketing dari performa iklan, traffic toko, hingga hasil livestream."
    >
      <ModuleHub
        summaryTitle="Pilih platform"
        summaryDescription="Lihat ringkasan visual masing-masing platform untuk membaca tren dan performa secara cepat."
        bullets={[
          "Shopee: traffic toko, performa livestream, dan efektivitas MP Ads dalam satu dashboard visual.",
        ]}
        items={[
          {
            title: "Shopee",
            description: "Traffic toko, performa livestream, dan efektivitas MP Ads Shopee.",
            href: "/analytics/marketing/shopee",
            icon: Store,
          },
          {
            title: "TikTok",
            description: "Traffic toko, performa livestream, dan efektivitas MP Ads TikTok.",
            href: "/analytics/marketing/tiktok",
            icon: Music,
          },
        ]}
      />
    </PageShell>
  );
}
