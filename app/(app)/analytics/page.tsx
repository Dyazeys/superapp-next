import { ChartBar } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireAuth } from "@/lib/authz";
import { hasAnyPermission, PERMISSIONS } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await requireAuth();

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.ANALYTICS_REPORT_PNL_VIEW,
      PERMISSIONS.ANALYTICS_BUDGET_METERS_VIEW,
    ])
  ) {
    redirect("/dashboard");
  }

  return (
    <PageShell
      eyebrow="Analytic"
      title="Analytic overview"
      description="Overview ini berfungsi seperti README operasional: Analytic adalah tempat membaca, memvisualisasikan, dan menafsirkan data yang sebelumnya dicatat atau diproses lewat ERP."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Apa isi modul ini?" description="Analytic adalah workspace visualisasi data yang membaca dan menyajikan tren dari data yang dicatat di ERP.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Workspace ini menyajikan visualisasi report profit, kontrol budget, dan dashboard performa dari data bisnis yang sudah masuk lewat ERP.</p>
            <p>Tujuannya bukan input transaksi harian, tapi melihat pola, tren, dan sinyal performa dari data yang sudah tercatat.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Cara pakai" description="Urutan baca yang paling enak untuk tim operasional dan growth.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Mulai dari dashboard ini untuk memahami fungsi tiap area, lalu masuk ke report yang paling relevan dengan pertanyaan hari itu.</p>
            <p>Kalau fokusnya margin, buka Financial lalu Report PNL. Kalau fokusnya kontrol biaya, buka Financial lalu Budget Meters.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Hubungan dengan ERP" description="Analytic bergantung pada kualitas data yang dicatat di workspace ERP.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Setiap transaksi yang dicatat di ERP menjadi bahan visualisasi di Analytic. Semakin disiplin pencatatan, semakin akurat insight yang bisa dibaca.</p>
            <p>Prinsipnya: kalau ingin mengisi data masuk ke ERP, kalau ingin membaca hasil dan visualisasinya masuk ke Analytic.</p>
          </div>
        </WorkspacePanel>
      </div>

      <ModuleHub
        summaryTitle="Submenu utama"
        summaryDescription="Area ini adalah tulang punggung workspace Analytic saat ini."
        bullets={[
          "Financial dipakai untuk membaca angka bisnis seperti profit, margin, biaya, dan disiplin budget dari data keuangan ERP.",
        ]}
        items={[
          {
            title: "Financial",
            description: "Area visualisasi untuk report PNL dan budget meter agar performa keuangan lebih mudah dibaca.",
            href: "/analytics/financial",
            icon: ChartBar,
          },
        ]}
      />
    </PageShell>
  );
}
