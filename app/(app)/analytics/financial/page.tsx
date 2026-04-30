import { Gauge, ScrollText } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireAuth } from "@/lib/authz";
import { hasAnyPermission, PERMISSIONS } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AnalyticsFinancialPage() {
  const session = await requireAuth();

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
      PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    ])
  ) {
    redirect("/analytics");
  }

  return (
    <PageShell
      eyebrow="Analytic"
      title="Financial"
      description="Overview awal untuk area financial di workspace Analytic: tempat membaca visualisasi profit, budget control, dan kesehatan bisnis dari data keuangan yang masuk lewat ERP."
    >
      <ModuleHub
        summaryTitle="Fungsi utama"
        summaryDescription="Area Financial dipakai saat tim ingin membaca performa bisnis dari sisi profit, biaya, dan disiplin budget tanpa masuk ke layar input ERP."
        bullets={[
          "Report PNL dipakai untuk membaca sales, margin, dan biaya utama per periode atau per channel dari data keuangan yang sudah tercatat.",
          "Budget Meters dipakai untuk memantau realisasi budget agar beban operasional tetap terlihat cepat dan terkendali.",
        ]}
        items={[
          {
            title: "Report PNL",
            description: "Visualisasi profit and loss untuk membaca kesehatan bisnis dari sisi revenue, margin, dan biaya utama.",
            href: "/dashboard/report-pnl",
            icon: ScrollText,
          },
          {
            title: "Budget Meters",
            description: "Visualisasi kontrol budget dan realisasi beban untuk monitoring biaya secara cepat.",
            href: "/dashboard/budget-meters",
            icon: Gauge,
          },
        ]}
      />
    </PageShell>
  );
}
