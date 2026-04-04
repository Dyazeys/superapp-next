"use client";

import Link from "next/link";
import { ArrowRight, Boxes, ReceiptText } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const salesSections = [
  {
    title: "Sales Orders",
    description: "Kelola header pesanan tanpa mengubah integrasi stok & akuntansi yang ada.",
    href: "/sales/orders",
    icon: ReceiptText,
  },
  {
    title: "Sales Order Items",
    description: "Kelola item pesanan dengan perilaku posting pergerakan stok yang sama.",
    href: "/sales/order-items",
    icon: Boxes,
  },
] as const;

export function SalesOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Alur kerja" description="Urutan umum untuk operasional penjualan.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Buat/cek Sales Orders untuk transaksi utama.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Lengkapi Sales Order Items untuk detail barang dan qty.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Konsistensi stok" description="Menjaga pergerakan stok tetap sinkron.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Perubahan item tetap mengikuti perilaku posting yang sudah ada.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Gunakan Warehouse ledger untuk audit jika ada selisih.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Master referensi" description="Data pendukung untuk kelancaran input.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Pastikan Channels rapi agar pelaporan lebih konsisten.</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        {salesSections.map((section) => {
          const Icon = section.icon;

          return (
            <WorkspacePanel key={section.href} title={section.title} description={section.description}>
              <Link
                href={section.href}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="size-4" />
                  </span>
                  Buka halaman
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </WorkspacePanel>
          );
        })}
      </div>
    </div>
  );
}
