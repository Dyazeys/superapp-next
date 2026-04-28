import { Camera, Tv } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";

export default function ContentPage() {
  return (
    <PageShell
      eyebrow="Konten"
      title="Konten module"
      description="Ruang kerja awal untuk memisahkan monitoring konten TikTok dan Instagram dalam satu area yang rapi."
    >
      <ModuleHub
        summaryTitle="Fokus konten"
        summaryDescription="Modul ini menyiapkan slot kerja konten per platform supaya insight tidak tercampur."
        bullets={[
          "Pisahkan TikTok dan Instagram agar ritme konten, engagement, dan evaluasinya lebih jelas.",
          "Struktur ini enak dipakai kalau nanti kamu mau isi kalender konten, performa posting, atau recap campaign.",
        ]}
        items={[
          {
            title: "Tiktok",
            description: "Workspace untuk konten TikTok, performa video, dan ritme posting.",
            href: "/content/tiktok",
            icon: Tv,
          },
          {
            title: "Instagram",
            description: "Workspace untuk konten Instagram, performa feed, reels, dan story.",
            href: "/content/instagram",
            icon: Camera,
          },
        ]}
      />
    </PageShell>
  );
}
