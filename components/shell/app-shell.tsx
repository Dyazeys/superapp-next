"use client";

import { Button } from "@/components/ui/button";
import { IconRail } from "@/components/shell/icon-rail";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
import { TOP_NAV_ITEMS, ERP_MODULE_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTop, setActiveTop] = useState(TOP_NAV_ITEMS[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const sidebarModules = activeTop === "erp" ? ERP_MODULE_ITEMS : [];

  const navMatch = sidebarModules.find(
    (module) => pathname === module.href || pathname.startsWith(`${module.href}/`)
  );
  const childMatch = navMatch?.children?.find(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
  );
  const pageTitle = childMatch?.label ?? navMatch?.label ?? "Workspace";

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
      "/payout": "Ringkasan payout, adjustment, dan nilai bersih berdasarkan data yang ada.",
      "/payout/records": "Kelola header payout dan cek nilai gross/net.",
      "/payout/adjustments": "Kelola adjustment payout sesuai referensi yang sudah ada.",
      "/payout/transfers": "Catat perpindahan saldo channel ke rekening bank secara manual.",
      "/payout/reconciliation": "Bandingkan piutang, payout, saldo, dan transfer bank per channel secara read-only.",
    };

    return contexts[pathname] ?? contexts[navMatch?.href ?? ""] ?? "Ruang kerja ERP untuk operasional harian.";
  })();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <IconRail
        activeTop={activeTop}
        onSelect={(top) => {
          setActiveTop(top);
          setSidebarCollapsed(false);
        }}
      />

      <div className="flex h-screen min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "h-screen shrink-0 border-r border-slate-200 transition-[width] duration-200",
            sidebarCollapsed ? "w-0" : "w-[280px]"
          )}
        >
          {!sidebarCollapsed && (
            <ModuleSidebar
              collapsed={sidebarCollapsed}
              modules={sidebarModules}
              onToggle={() => setSidebarCollapsed(true)}
            />
          )}
        </div>

        <div className="flex h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {activeTop.toUpperCase()}
                  {navMatch ? ` / ${navMatch.label}` : ""}
                  {childMatch ? ` / ${childMatch.label}` : ""}
                </p>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{pageTitle}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{pageContext}</p>
              </div>

              {sidebarCollapsed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Show modules"
                >
                  <PanelLeftOpen className="size-4" />
                  Tampilkan menu
                </Button>
              ) : null}
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
