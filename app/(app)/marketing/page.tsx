import { Megaphone, Globe, MonitorPlay, ScanSearch } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";

export default function MarketingPage() {
  return (
    <PageShell
      eyebrow="Marketing"
      title="Marketing module"
      description="Ruang kerja awal untuk monitoring performa produk, traffic, iklan marketplace, dan aktivitas live streaming."
    >
      <ModuleHub
        summaryTitle="Fokus utama"
        summaryDescription="Modul ini menyiapkan area kerja tim marketing dalam satu pintu masuk."
        bullets={[
          "Pantau performa produk untuk lihat item mana yang paling efektif mendorong penjualan.",
          "Pisahkan traffic, iklan, dan live supaya analisisnya tidak campur dan lebih gampang dibaca.",
        ]}
        items={[
          {
            title: "Performa Produk",
            description: "Slot untuk ranking SKU, conversion, dan indikator performa produk.",
            href: "/marketing/product-performance",
            icon: ScanSearch,
          },
          {
            title: "Traffic",
            description: "Area untuk sumber kunjungan, funnel traffic, dan ringkasan harian.",
            href: "/marketing/traffic",
            icon: Globe,
          },
          {
            title: "Iklan MP",
            description: "Workspace untuk biaya iklan marketplace, ROAS, dan efisiensi campaign.",
            href: "/marketing/mp-ads",
            icon: Megaphone,
          },
          {
            title: "Live Streaming",
            description: "Halaman untuk memantau jadwal, hasil live, dan dampaknya ke penjualan.",
            href: "/marketing/live-streaming",
            icon: MonitorPlay,
          },
        ]}
      />
    </PageShell>
  );
}
