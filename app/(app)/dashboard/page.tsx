import { ArrowUpRight, Boxes, Clock3, PackageCheck, ShoppingCart, UsersRound } from "lucide-react";
import { DashboardRevenueChartClient } from "@/components/charts/dashboard-revenue-chart-client";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { MetricCard } from "@/components/layout/stats-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RECENT_ACTIVITIES } from "@/lib/constants";
import { FOUNDATION_CHECKLIST } from "@/lib/foundation-data";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Dashboard"
      title="ERP Operations Overview"
      description="Ringkasan performa operasional harian dengan fokus scan cepat: KPI utama, tren revenue, dan aktivitas terbaru lintas modul."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Orders"
          value="40,178"
          subtitle="Naik 6.4% dari minggu lalu"
          icon={<ShoppingCart className="size-4" />}
        />
        <MetricCard
          title="Revenue"
          value="Rp1.84B"
          subtitle="Target bulan ini 78%"
          icon={<ArrowUpRight className="size-4" />}
        />
        <MetricCard
          title="Active SKU"
          value="7,805"
          subtitle="23 item perlu restock"
          icon={<PackageCheck className="size-4" />}
        />
        <MetricCard
          title="Customer Active"
          value="1,452"
          subtitle="Akun transaksi 30 hari"
          icon={<UsersRound className="size-4" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <WorkspacePanel title="Revenue Trend" description="Performa pendapatan mingguan untuk monitoring cepat tim operasional.">
          <DashboardRevenueChartClient />
        </WorkspacePanel>

        <WorkspacePanel
          title="Operational Summary"
          description="Progress area kritikal untuk memastikan ritme kerja harian tetap stabil."
        >
          <div className="space-y-3">
            {[
              { label: "Order Processing", value: 82, note: "On-track" },
              { label: "Warehouse Fulfillment", value: 74, note: "Perlu monitoring" },
              { label: "Payout Reconciliation", value: 68, note: "Antrian naik" },
              { label: "Accounting Posting", value: 91, note: "Stabil" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <span className="text-xs font-semibold text-slate-500">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-slate-700" style={{ width: `${item.value}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <WorkspacePanel
          title="Latest Activities"
          description="Timeline ringkas aktivitas utama dari order, warehouse, customer, dan monitoring stok."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_ACTIVITIES.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium text-slate-800">{activity.title}</TableCell>
                  <TableCell className="max-w-[360px] whitespace-normal text-slate-600">{activity.description}</TableCell>
                  <TableCell className="text-slate-500">{activity.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorkspacePanel>

        <WorkspacePanel
          title="System Readiness"
          description="Checklist singkat area sistem yang menjadi baseline operasional harian."
        >
          <div className="space-y-3">
            {FOUNDATION_CHECKLIST.map(([label, state]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Boxes className="size-3.5 text-slate-500" />
                  <span className="text-sm text-slate-700">{label}</span>
                </div>
                <StatusBadge
                  label={state === "done" ? "Done" : "Next"}
                  tone={state === "done" ? "success" : "info"}
                />
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-500">
              <Clock3 className="size-3.5" />
              Last updated: 11 Apr 2026, 09:20 WIB
            </div>
          </div>
        </WorkspacePanel>
      </section>
    </PageShell>
  );
}
