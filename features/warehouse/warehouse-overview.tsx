"use client";

import Link from "next/link";
import { ArrowRight, Box, Boxes, ClipboardList, PackageCheck, PackageSearch, ScanSearch, Truck, Undo2 } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const warehouseSections = [
  {
    title: "Vendors",
    description: "Master vendor untuk PO dan proses penerimaan barang.",
    href: "/warehouse/vendors",
    icon: Truck,
  },
  {
    title: "Purchase Orders",
    description: "Daftar PO untuk kontrol pembelian dan keterkaitan inbound.",
    href: "/warehouse/purchase-orders",
    icon: ClipboardList,
  },
  {
    title: "Inbound",
    description: "Penerimaan barang: header inbound dan status QC.",
    href: "/warehouse/inbound",
    icon: PackageCheck,
  },
  {
    title: "Inbound Items",
    description: "Detail item inbound untuk posting stok dari qty lulus QC.",
    href: "/warehouse/inbound-items",
    icon: Boxes,
  },
  {
    title: "Adjustments",
    description: "Koreksi stok manual untuk kebutuhan operasional dan audit.",
    href: "/warehouse/adjustments",
    icon: Box,
  },
  {
    title: "Stock Balances",
    description: "Saldo on-hand terkini dari ledger stok yang sudah ada.",
    href: "/warehouse/stock-balances",
    icon: ScanSearch,
  },
  {
    title: "Returns",
    description: "Verifikasi retur pelanggan, pisahkan kondisi baik dan rusak.",
    href: "/warehouse/returns",
    icon: Undo2,
  },
  {
    title: "Stock Movements",
    description: "Riwayat pergerakan stok dari inbound, adjustment, dan sales.",
    href: "/warehouse/stock-movements",
    icon: PackageSearch,
  },
] as const;

export function WarehouseOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Fokus hari ini" description="Kontrol stok tanpa mengubah alur posting yang ada.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Pastikan inbound yang selesai QC sudah mem-posting qty.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Cek Stock Balances untuk melihat on-hand terbaru.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Dokumen utama" description="Kerapian dokumen membantu traceability.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>PO → Inbound → Inbound Items sebagai alur standar.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Gunakan Adjustments hanya untuk koreksi yang valid.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Analisis cepat" description="Gunakan ledger untuk audit dan investigasi.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Stock Movements menjadi sumber jejak pergerakan.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Vendor dan PO memudahkan penelusuran pemasok.</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {warehouseSections.map((section) => {
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
