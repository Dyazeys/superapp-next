"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
import { TOP_NAV_ITEMS, ERP_MODULE_ITEMS, ANALYTICS_MODULE_ITEMS, TASK_MODULE_ITEMS, TEAM_MODULE_ITEMS, type ModuleNavItem } from "@/lib/navigation";
import { hasAnyPermission, hasPermission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Bot, PanelLeftOpen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Recursively checks if pathname matches any item or its children.
 * This is needed because items like /dashboard/report-pnl are nested
 * under "Financial" child array in ANALYTICS_MODULE_ITEMS, while being
 * matched by /dashboard/* in ERP_MODULE_ITEMS at top level.
 */
function isPathInModuleItems(pathname: string, items: ModuleNavItem[]): boolean {
  return items.some((item) => {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
    if (item.children?.length) return isPathInModuleItems(pathname, item.children);
    return false;
  });
}

function topNavForPath(
  pathname: string,
  preferredTop?: (typeof TOP_NAV_ITEMS)[number]["id"]
) {
  if (
    TASK_MODULE_ITEMS.some(
      (module) => pathname === module.href || pathname.startsWith(`${module.href}/`)
    )
  ) {
    return "task" as const;
  }

  if (
    TEAM_MODULE_ITEMS.some(
      (module) => pathname === module.href || pathname.startsWith(`${module.href}/`)
    )
  ) {
    return "team" as const;
  }

  const inErp = isPathInModuleItems(pathname, ERP_MODULE_ITEMS);
  const inAnalytics = isPathInModuleItems(pathname, ANALYTICS_MODULE_ITEMS);

  // Ambiguous: path matches both ERP and Analytics (e.g. /marketing/*, /content/*, /dashboard/report-pnl)
  // → use the preferred top-nav context (last manual selection) instead of jumping
  if (inErp && inAnalytics) {
    if (preferredTop === "analytics") return "analytics" as const;
    return "erp" as const;
  }

  if (inErp) return "erp" as const;
  if (inAnalytics) return "analytics" as const;

  return "erp" as const;
}

function overviewPathForTopNav(topId: (typeof TOP_NAV_ITEMS)[number]["id"]) {
  switch (topId) {
    case "analytics":
      return "/analytics";
    case "task":
      return "/task";
    case "team":
      return "/team";
    case "erp":
    default:
      return "/dashboard";
  }
}

function filterModuleItems(items: ModuleNavItem[], permissions: string[]): ModuleNavItem[] {
  return items.reduce<ModuleNavItem[]>((visibleItems, item) => {
      const filteredChildren = item.children?.length ? filterModuleItems(item.children, permissions) : undefined;
      const canView =
        (item.permission ? hasPermission(permissions, item.permission) : false) ||
        (item.permissionAny ? hasAnyPermission(permissions, item.permissionAny) : false) ||
        (!item.permission && !item.permissionAny);
      if (!canView && !filteredChildren?.length) {
        return visibleItems;
      }

      visibleItems.push({
        ...item,
        children: filteredChildren,
      });

      return visibleItems;
    }, []);
}

export function AppShell({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastManualTop, setLastManualTop] = useState<(typeof TOP_NAV_ITEMS)[number]["id"]>("erp");
  const { data: session, status } = useSession();
  const resolvedSession = status === "loading" ? (session ?? initialSession) : session;
  const permissions = resolvedSession?.user?.permissions ?? [];
  const filteredErpModules = filterModuleItems(ERP_MODULE_ITEMS, permissions);
  const filteredAnalyticsModules = filterModuleItems(ANALYTICS_MODULE_ITEMS, permissions);
  const filteredTaskModules = filterModuleItems(TASK_MODULE_ITEMS, permissions);
  const filteredTeamModules = filterModuleItems(TEAM_MODULE_ITEMS, permissions);
  const visibleTopNavItems = TOP_NAV_ITEMS.filter((item) => {
    if (item.disabled) return true;
    if (item.id === "erp") return filteredErpModules.length > 0;
    if (item.id === "analytics") return filteredAnalyticsModules.length > 0;
    if (item.id === "task") return filteredTaskModules.length > 0;
    if (item.id === "team") return filteredTeamModules.length > 0;
    return true;
  });

  const activeTop = topNavForPath(pathname, lastManualTop);

  const activeTopItem = visibleTopNavItems.find((item) => item.id === activeTop) ?? visibleTopNavItems[0] ?? TOP_NAV_ITEMS[0];

  const sidebarModules =
    activeTop === "erp"
      ? filteredErpModules
      : activeTop === "analytics"
        ? filteredAnalyticsModules
        : activeTop === "task"
          ? filteredTaskModules
        : activeTop === "team"
          ? filteredTeamModules
          : [];

  const navMatch = sidebarModules.find(
    (module) => pathname === module.href || pathname.startsWith(`${module.href}/`)
  );
  const childMatch = navMatch?.children?.find(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
  );
  const pageTitle = childMatch?.label ?? navMatch?.label ?? activeTopItem.label;

  const pageContext = (() => {
    const contexts: Record<string, string> = {
      "/products": "Ringkasan cepat untuk master data produk dan struktur BOM.",
      "/products/categories": "Atur kategori untuk menjaga struktur katalog dan pelaporan tetap rapi.",
      "/products/inventory": "Kelola master inventory yang dipakai di produk, inbound, dan pergerakan stok.",
      "/products/master": "Kelola master produk, SKU, variasi, dan atribut dasar.",
      "/products/bom": "Kelola komponen BOM untuk perhitungan dan pelacakan struktur produk.",
      "/warehouse": "Pantau alur inbound, pergerakan stok, dan saldo persediaan harian.",
      "/warehouse/vendors": "Data vendor untuk PO dan penerimaan barang.",
      "/warehouse/purchase-orders": "Daftar PO untuk kontrol pembelian dan follow-up inbound.",
      "/warehouse/inbound": "Penerimaan barang: header inbound dan status QC.",
      "/warehouse/inbound-items": "Detail item inbound untuk posting stok dari qty lulus QC.",
      "/warehouse/adjustments": "Penyesuaian stok manual untuk koreksi dengan jejak audit.",
      "/warehouse/stock-balances": "Saldo on-hand terkini dari ledger stok yang sudah ada.",
      "/warehouse/stock-movements": "Riwayat pergerakan stok dari inbound, adjustment, dan sales.",
      "/sales": "Akses cepat untuk alur pesanan dan item penjualan.",
      "/sales/orders": "Kelola sales order tanpa mengubah mekanisme posting stok yang sudah berjalan.",
      "/sales/customers": "Kelola customer master minimal untuk referensi sales order dan ringkasan order per customer.",
      "/sales/channels": "Lihat master channel penjualan untuk referensi transaksi dan pelaporan yang konsisten.",
      "/marketing": "Area Analytic untuk membaca visualisasi performa marketing dari data aktivitas yang sebelumnya dicatat tim di ERP.",
      "/marketing/product-performance": "Visualisasi performa produk dari data operasional dan aktivitas promosi yang sudah masuk lewat ERP.",
      "/marketing/traffic": "Visualisasi sumber traffic dan kualitas funnel kunjungan dari data kerja marketing yang sudah dicatat.",
      "/marketing/mp-ads": "Visualisasi iklan marketplace, spend, dan efisiensi campaign dari data marketing harian.",
      "/marketing/live-streaming": "Visualisasi performa live streaming dan dampaknya ke penjualan dari aktivitas yang dicatat tim.",
      "/content": "Catat dan pantau aktivitas upload konten harian untuk seluruh platform. Input, filter, dan kelola data daily upload di satu workspace.",
      "/analytics": "Overview ini menjelaskan isi workspace Analytic sebagai tempat visualisasi, pembacaan, dan insight dari data yang sebelumnya dicatat lewat ERP.",
      "/analytics/financial": "Area financial di Analytic dipakai untuk membaca visualisasi report PNL dan budget meter dari data keuangan ERP.",
      "/task": "Ruang kerja personal untuk ritme eksekusi harian, daftar tugas, KPI, dan absensi tiap anggota tim.",
      "/task/tugas-saya": "Kelola daftar kerja pribadi, prioritas, target, dan progres eksekusi harian dalam satu area personal.",
      "/task/tugas-saya/to-do": "Jaga tugas aktif, prioritas, deadline, dan blocker pribadi tetap terlihat dan mudah ditindaklanjuti.",
      "/task/tugas-saya/kpi": "Pantau target personal, indikator hasil kerja, dan progres KPI tanpa bercampur dengan area team yang lebih umum.",
      "/task/absensi": "Kelola kehadiran pribadi, ritme kerja harian, dan kebutuhan administratif dasar seperti izin atau sakit.",
      "/task/absensi/clock-in-out": "Catat check-in, check-out, dan ringkasan kehadiran personal harian sebagai jejak kerja dasar.",
      "/task/absensi/izin-sakit": "Ajukan izin atau sakit beserta bukti dan pantau status approval dari area personal yang sama.",
      "/task/kalender-saya": "Baca deadline, meeting, dan ritme kerja pribadi dalam bentuk kalender yang lebih mudah dipindai cepat.",
      "/team": "Ruang kerja team untuk koordinasi meeting, notulen, tindak lanjut hasil rapat, dan kontrol akses aplikasi.",
      "/team/meeting": "Kelola agenda sinkronisasi, notulen, dan tindak lanjut hasil rapat agar kerja tim tetap nyambung.",
      "/team/meeting/notulen": "Simpan catatan rapat tim dengan format notulen yang mudah dibaca ulang dan di-follow up.",
      "/team/meeting/to-do": "Turunkan hasil rapat menjadi action item tim yang punya PIC, deadline, dan status progres jelas.",
      "/team/kalender-tim": "Jaga sinkronisasi jadwal bersama, deadline lintas divisi, dan event operasional dalam satu kalender tim.",
      "/team/pengumuman": "Sebarkan info internal, perubahan operasional, dan update penting tim dari satu area komunikasi bersama.",
      "/team/approval": "Kelola alur persetujuan internal dengan jejak status dan approver yang jelas untuk kebutuhan tim.",
      "/team/struktur-tim": "Lihat susunan tim, divisi, jabatan, dan jalur koordinasi agar tanggung jawab lebih mudah dibaca.",
      "/team/sop": "Simpan SOP, guideline, dan dokumentasi proses kerja agar standar operasional tim mudah diakses ulang.",
      "/team/users": "Kelola akun user internal yang boleh masuk ke aplikasi sesuai peran masing-masing.",
      "/team/roles": "Atur role dan permission agar akses tiap tim tetap rapi, aman, dan sesuai tanggung jawab.",
      "/channel": "Kelola struktur master channel untuk referensi transaksi lintas modul.",
      "/channel/groups": "Kelola pengelompokan channel untuk struktur referensi yang rapi.",
      "/channel/categories": "Kelola kategori channel untuk konsistensi segmentasi channel.",
      "/channel/channels": "Kelola master channel penjualan sebagai referensi transaksi.",
      "/accounting": "Akses baca data akuntansi (COA, jurnal, dan detail entry) dari tabel yang ada.",
      "/accounting/journals": "Lihat daftar jurnal untuk pengecekan sumber pencatatan.",
      "/accounting/journal-entries": "Lihat detail debit/kredit untuk rekonsiliasi cepat.",
      "/accounting/accounts": "Lihat COA dan relasi parent untuk struktur akun.",
      "/accounting/channel-report": "Ringkasan accounting per channel berbasis jurnal: sales, payout, saldo, transfer, outstanding, dan status.",
      "/dashboard/budget-meters": "Visualisasi budget dan realisasi beban bulanan sebagai titik awal kontrol biaya di modul Analytic.",
      "/dashboard/report-pnl": "Visualisasi profit and loss bulanan dengan filter channel untuk membaca sales, margin, dan biaya utama dari data ERP.",
      "/payout": "Ringkasan payout, adjustment, dan nilai bersih berdasarkan data yang ada.",
      "/payout/records": "Kelola header payout dan cek nilai gross/net.",
      "/payout/adjustments": "Kelola adjustment payout sesuai referensi yang sudah ada.",
      "/payout/transfers": "Catat perpindahan saldo channel ke rekening bank secara manual.",
      "/payout/reconciliation": "Bandingkan piutang, payout, saldo, dan transfer bank per channel secara read-only.",
      "/master-data/import": "Upload CSV untuk import master data secara terkontrol dengan validasi kolom dan ringkasan hasil.",
      "/master-data/import-txt": "Upload template TXT (JSON text) untuk apply BOM massal per product name ke semua SKU terkait.",
      "/profile": "Kelola data akun dan preferensi profil pengguna.",
    };

    return (
      contexts[pathname] ??
      contexts[navMatch?.href ?? ""] ??
      `Ruang kerja ${activeTopItem.label} untuk operasional harian.`
    );
  })();
  const userName = resolvedSession?.user?.name?.trim() || "Operator";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="flex h-screen min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "h-screen shrink-0 transition-[width] duration-200",
            sidebarCollapsed ? "w-[84px]" : "w-[280px]"
          )}
        >
          {sidebarCollapsed ? (
            <aside className="flex h-screen flex-col border-r border-slate-200/70 bg-slate-100/60 p-3">
              <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-50/80 p-2 ring-1 ring-slate-200/70">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Show modules"
                  className="h-10 w-full rounded-xl border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                >
                  <PanelLeftOpen className="size-5" />
                </Button>
                {sidebarModules.map((module) => {
                  const active =
                    pathname === module.href || pathname.startsWith(`${module.href}/`);
                  const Icon = module.icon;

                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      title={module.label}
                      aria-label={module.label}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-xl transition-all duration-200",
                        active
                          ? "bg-white text-sky-600 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-400 hover:bg-white hover:text-slate-700"
                      )}
                    >
                      <Icon className="size-5" />
                    </Link>
                  );
                })}
              </div>
            </aside>
          ) : (
            <ModuleSidebar
              collapsed={sidebarCollapsed}
              modules={sidebarModules}
              moduleTitle={activeTopItem.label}
              userInitials={userInitials}
              permissions={permissions}
              onToggle={() => setSidebarCollapsed(true)}
            />
          )}
        </div>

        <div className="flex h-screen min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.03)_0%,rgba(255,255,255,0)_54%)]">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-background/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-2 py-1.5 shadow-sm">
                <div className="flex min-h-9 min-w-0 flex-1 items-center gap-3">
                  <nav className="flex w-full items-center gap-2 rounded-xl p-0 text-slate-600">
                    <div className="flex w-full items-center justify-between gap-2">
                      {visibleTopNavItems.map((item) => {
                        const active = activeTop === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            title={item.label}
                            className={cn(
                              "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                              active
                                ? "bg-slate-100 text-slate-900 ring-1 ring-slate-200"
                                : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                              item.disabled && "cursor-not-allowed opacity-40"
                            )}
                            onClick={() => {
                              if (!item.disabled) {
                                setLastManualTop(item.id);
                                setSidebarCollapsed(false);
                                router.push(overviewPathForTopNav(item.id));
                              }
                            }}
                            aria-label={item.label}
                          >
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {activeTopItem.label.toUpperCase()}
                  {navMatch ? ` / ${navMatch.label}` : ""}
                  {childMatch ? ` / ${childMatch.label}` : ""}
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">{pageTitle}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{pageContext}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background">
            <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled
        title="AI Assistant coming soon"
        className="fixed right-6 bottom-6 z-30 inline-flex items-center gap-3 rounded-full border border-slate-200/90 bg-white/95 px-4 py-3 text-left text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur opacity-80"
      >
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
          <Bot className="size-5" />
        </span>
        <span className="hidden min-[430px]:block">
          <span className="block text-sm font-semibold text-slate-800">AI Assistant</span>
          <span className="block text-xs text-slate-500">Coming soon</span>
        </span>
      </button>
    </div>
  );
}
