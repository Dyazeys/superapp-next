"use client";

import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const salesSections = [
  {
    title: "Sales Transactions",
    description: "Input order dan item dalam satu halaman transaksi supaya lebih cepat dan minim bolak-balik.",
    href: "/sales/orders",
    icon: ReceiptText,
  },
] as const;

export function SalesOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Alur kerja" description="Urutan umum operasional penjualan harian.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Buat/cek Sales Order dan isi item pada halaman transaksi yang sama.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Perubahan item langsung sinkron ke stok dan jurnal sesuai aturan existing.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Konsistensi stok" description="Menjaga pergerakan stok tetap sinkron.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Order normal mem-posting stok dari BOM aktif stock-tracked.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Order historical tetap aman karena tidak membuat posting stok.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Master referensi" description="Data pendukung untuk kelancaran input.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Pastikan Channels dan Products aktif agar input transaksi lancar.</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-1">
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
