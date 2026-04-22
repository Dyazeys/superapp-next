"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
import { TOP_NAV_ITEMS, ERP_MODULE_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTop, setActiveTop] = useState(TOP_NAV_ITEMS[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeTopItem = TOP_NAV_ITEMS.find((item) => item.id === activeTop) ?? TOP_NAV_ITEMS[0];

  const sidebarModules = activeTop === "erp" ? ERP_MODULE_ITEMS : [];

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
      "/sales/order-items": "Kelola detail item order untuk aliran stok dan perhitungan yang konsisten.",
      "/sales/customers": "Kelola customer master minimal untuk referensi sales order dan ringkasan order per customer.",
      "/channel": "Kelola struktur master channel untuk referensi transaksi lintas modul.",
      "/channel/groups": "Kelola pengelompokan channel untuk struktur referensi yang rapi.",
      "/channel/categories": "Kelola kategori channel untuk konsistensi segmentasi channel.",
      "/channel/channels": "Kelola master channel penjualan sebagai referensi transaksi.",
      "/accounting": "Akses baca data akuntansi (COA, jurnal, dan detail entry) dari tabel yang ada.",
      "/accounting/journals": "Lihat daftar jurnal untuk pengecekan sumber pencatatan.",
      "/accounting/journal-entries": "Lihat detail debit/kredit untuk rekonsiliasi cepat.",
      "/accounting/accounts": "Lihat COA dan relasi parent untuk struktur akun.",
      "/accounting/channel-report": "Ringkasan accounting per channel berbasis jurnal: sales, payout, saldo, transfer, outstanding, dan status.",
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
  const userName = session?.user?.name?.trim() || "Operator";
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
                      {TOP_NAV_ITEMS.map((item) => {
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
                                setActiveTop(item.id);
                                setSidebarCollapsed(false);
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
    </div>
  );
}
