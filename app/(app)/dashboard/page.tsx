import { ArrowUpRight, Boxes, Clock3, PackageCheck, ShoppingCart, UsersRound } from "lucide-react";
import { DashboardRevenueChartClient } from "@/components/charts/dashboard-revenue-chart-client";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { MetricCard } from "@/components/layout/stats-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardOverview } from "@/lib/dashboard";

function formatCompactIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <PageShell
      eyebrow="Dashboard"
      title="ERP Operations Overview"
      description="Ringkasan performa operasional harian dengan fokus scan cepat: KPI utama, tren revenue, dan aktivitas terbaru lintas modul."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Orders"
          value={formatNumber(overview.metrics.totalOrders)}
          subtitle={`${formatNumber(overview.metrics.weekOrders)} order tercatat 7 hari terakhir`}
          icon={<ShoppingCart className="size-4" />}
        />
        <MetricCard
          title="Revenue 30 Hari"
          value={formatCompactIdr(overview.metrics.totalRevenue)}
          subtitle="Akumulasi dari sales order pada 30 hari terakhir"
          icon={<ArrowUpRight className="size-4" />}
        />
        <MetricCard
          title="Active SKU"
          value={formatNumber(overview.metrics.activeSku)}
          subtitle="Master produk aktif siap dipakai transaksi"
          icon={<PackageCheck className="size-4" />}
        />
        <MetricCard
          title="Customer Active"
          value={formatNumber(overview.metrics.activeCustomers)}
          subtitle="Customer aktif pada master sales"
          icon={<UsersRound className="size-4" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <WorkspacePanel title="Revenue Trend" description="Performa pendapatan 7 hari terakhir dari data sales order.">
          <DashboardRevenueChartClient series={overview.revenueSeries} />
        </WorkspacePanel>

        <WorkspacePanel
          title="Operational Summary"
          description="Progress area kritikal untuk memastikan ritme kerja harian tetap stabil."
        >
          <div className="space-y-3">
            {[
              {
                label: "Order Coverage",
                value: Math.min(100, Math.max(5, Math.round((overview.metrics.weekOrders / Math.max(1, overview.metrics.totalOrders)) * 100))),
                note: "Proporsi order mingguan terhadap total data order",
              },
              {
                label: "SKU Coverage",
                value: Math.min(100, Math.max(5, Math.round(overview.metrics.activeSku > 0 ? 85 : 20))),
                note: "Ketersediaan master SKU aktif",
              },
              {
                label: "Customer Coverage",
                value: Math.min(100, Math.max(5, Math.round(overview.metrics.activeCustomers > 0 ? 82 : 18))),
                note: "Kelengkapan master customer aktif",
              },
              {
                label: "Data Freshness",
                value: 90,
                note: "Dashboard membaca data real-time langsung dari database",
              },
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
          description="Timeline aktivitas terbaru dari sales dan pergerakan stok."
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
              {overview.recentActivities.length === 0 ? (
                <TableRow>
                  <TableCell className="font-medium text-slate-500" colSpan={3}>
                    Belum ada aktivitas untuk ditampilkan.
                  </TableCell>
                </TableRow>
              ) : (
                overview.recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium text-slate-800">{activity.title}</TableCell>
                    <TableCell className="max-w-[360px] whitespace-normal text-slate-600">{activity.description}</TableCell>
                    <TableCell className="text-slate-500">{activity.timestamp}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </WorkspacePanel>

        <WorkspacePanel
          title="System Readiness"
          description="Checklist singkat area sistem yang menjadi baseline operasional harian."
        >
          <div className="space-y-3">
            {overview.readiness.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Boxes className="size-3.5 text-slate-500" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <StatusBadge
                  label={item.state === "done" ? "Done" : "Next"}
                  tone={item.state === "done" ? "success" : "info"}
                />
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-500">
              <Clock3 className="size-3.5" />
              Last updated: {overview.lastUpdatedLabel} WIB
            </div>
          </div>
        </WorkspacePanel>
      </section>
    </PageShell>
  );
}
