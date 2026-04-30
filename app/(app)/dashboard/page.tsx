import {
  Calculator,
  ClipboardList,
  HandCoins,
  Megaphone,
  PenSquare,
  RadioTower,
  Warehouse,
  Boxes,
} from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { ModuleHub } from "@/features/shared/module-hub";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="ERP"
      title="ERP overview"
      description="Overview ini berfungsi seperti README operasional: ERP adalah tempat input, transaksi, dan pemeliharaan data harian yang nanti dibaca kembali oleh workspace Analytic."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Apa isi modul ini?" description="ERP jadi rumah utama untuk transaksi harian, master data, dan pengisian data operasional lintas divisi.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Workspace ini dipakai untuk mencatat aktivitas nyata: penjualan, gudang, accounting, payout, produk, channel, sampai kerja harian marketing dan konten.</p>
            <p>Data yang masuk dari ERP inilah yang nantinya jadi sumber bacaan dan visualisasi di workspace Analytic.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Cara pakai" description="Urutan pakai yang paling tepat untuk user operasional sehari-hari.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Mulai dari overview ini untuk memahami peran tiap area, lalu masuk ke submenu yang paling dekat dengan pekerjaanmu hari itu.</p>
            <p>Kalau fokusnya input order buka Sales, kalau stok dan penerimaan barang buka Warehouse, kalau angka dan jurnal buka Accounting atau Payout, dan kalau input kerja harian campaign atau konten buka Marketing atau Konten.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Hubungan dengan Analytic" description="ERP tidak berdiri sendiri, karena data operasionalnya akan dipakai lagi untuk kebutuhan visualisasi.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Contohnya, tim bisa mengisi upload harian konten atau aktivitas campaign di ERP, lalu hasilnya dibaca sebagai insight, tren, atau performa di Analytic.</p>
            <p>Prinsipnya: ERP untuk membuat dan merapikan data, Analytic untuk membaca dan memvisualisasikan data tersebut.</p>
          </div>
        </WorkspacePanel>
      </div>

      <ModuleHub
        summaryTitle="Submenu utama"
        summaryDescription="Delapan area ini adalah tulang punggung workspace ERP saat ini."
        bullets={[
          "Sales, Warehouse, Accounting, dan Payout dipakai untuk input dan proses transaksi operasional harian.",
          "Product dan Channel dipakai untuk menjaga master data yang jadi fondasi modul lain tetap rapi.",
          "Marketing dan Konten tetap ada di ERP ketika tim perlu mengisi data kerja harian yang nanti divisualisasikan di Analytic.",
          "Kalau tujuanmu adalah mencatat atau memperbarui data, kemungkinan besar titik masuknya ada di ERP.",
        ]}
        items={[
          {
            title: "Sales",
            description: "Area input order penjualan dan customer untuk alur transaksi komersial harian.",
            href: "/sales",
            icon: HandCoins,
          },
          {
            title: "Warehouse",
            description: "Area input vendor, PO, inbound, adjustment, dan saldo stok untuk operasional gudang.",
            href: "/warehouse",
            icon: Warehouse,
          },
          {
            title: "Accounting",
            description: "Area COA, jurnal, dan opex untuk pencatatan finansial yang jadi sumber pembacaan angka.",
            href: "/accounting",
            icon: Calculator,
          },
          {
            title: "Payout",
            description: "Area payout, adjustment, transfer, dan rekonsiliasi nilai channel sebagai data operasional keuangan.",
            href: "/payout",
            icon: ClipboardList,
          },
          {
            title: "Product",
            description: "Area master produk, kategori, inventory, dan BOM sebagai fondasi data barang.",
            href: "/products",
            icon: Boxes,
          },
          {
            title: "Channel",
            description: "Area struktur channel untuk referensi transaksi dan pelacakan penjualan.",
            href: "/channel",
            icon: RadioTower,
          },
          {
            title: "Marketing",
            description: "Area kerja marketing untuk input aktivitas harian campaign yang nanti bisa dibaca performanya di Analytic.",
            href: "/marketing",
            icon: Megaphone,
          },
          {
            title: "Konten",
            description: "Area kerja konten untuk input aktivitas atau upload harian yang nanti divisualisasikan performanya di Analytic.",
            href: "/content",
            icon: PenSquare,
          },
        ]}
      />
    </PageShell>
  );
}
