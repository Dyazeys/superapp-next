import { ChartBar, Megaphone, PenSquare } from "lucide-react";
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
      PERMISSIONS.MARKETING_WORKSPACE_VIEW,
      PERMISSIONS.CONTENT_WORKSPACE_VIEW,
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
        <WorkspacePanel title="Apa isi modul ini?" description="Analytic dipakai untuk membaca performa lintas channel dan membantu tim ambil keputusan lebih cepat dari data ERP.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Workspace ini menggabungkan report profit, kontrol budget, serta area observasi marketing dan konten dalam bentuk pembacaan yang lebih mudah dipahami.</p>
            <p>Tujuannya bukan input transaksi harian, tapi melihat pola, tren, dan sinyal performa dari data yang sudah masuk lewat ERP.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Cara pakai" description="Urutan baca yang paling enak untuk tim operasional dan growth.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Mulai dari dashboard ini untuk memahami fungsi tiap area, lalu masuk ke report yang paling relevan dengan pertanyaan hari itu.</p>
            <p>Kalau fokusnya margin, buka Financial lalu Report PNL. Kalau fokusnya kontrol biaya, buka Financial lalu Budget Meters. Kalau fokusnya campaign atau upload harian, pindah ke Marketing atau Konten untuk melihat visualisasi performanya.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Hubungan dengan ERP" description="Analytic bergantung pada kualitas dan kedisiplinan data yang dicatat di workspace ERP.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Contohnya, upload harian konten atau aktivitas campaign bisa dicatat di ERP, lalu performa outputnya dibaca di Analytic sebagai tren, perbandingan, atau insight.</p>
            <p>Prinsipnya: kalau ingin mengisi data masuk ke ERP, kalau ingin membaca hasil dan visualisasinya masuk ke Analytic.</p>
          </div>
        </WorkspacePanel>
      </div>

      <ModuleHub
        summaryTitle="Submenu utama"
        summaryDescription="Tiga area ini adalah tulang punggung workspace Analytic saat ini."
        bullets={[
          "Financial dipakai untuk membaca angka bisnis seperti profit, margin, biaya, dan disiplin budget dari data keuangan ERP.",
          "Marketing dipakai untuk melihat performa campaign, traffic, ads, dan live streaming dari aktivitas yang dicatat tim operasional.",
          "Konten dipakai untuk membaca performa ritme upload, output kreatif, dan kualitas distribusi konten dari data kerja harian tim.",
        ]}
        items={[
          {
            title: "Financial",
            description: "Area visualisasi untuk report PNL dan budget meter agar performa keuangan lebih mudah dibaca.",
            href: "/analytics/financial",
            icon: ChartBar,
          },
          {
            title: "Marketing",
            description: "Area visualisasi performa kampanye, traffic, iklan marketplace, dan live streaming dari data marketing ERP.",
            href: "/marketing",
            icon: Megaphone,
          },
          {
            title: "Konten",
            description: "Area visualisasi performa output konten TikTok dan Instagram dari aktivitas upload harian yang dicatat tim.",
            href: "/content",
            icon: PenSquare,
          },
        ]}
      />
    </PageShell>
  );
}
