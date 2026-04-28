"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

type HubItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function ModuleHub({
  summaryTitle,
  summaryDescription,
  bullets,
  items,
}: {
  summaryTitle: string;
  summaryDescription: string;
  bullets: string[];
  items: HubItem[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title={summaryTitle} description={summaryDescription}>
          <div className="space-y-3 text-sm text-muted-foreground">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3">
                <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
                <p>{bullet}</p>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Ruang kerja" description="Submenu ini disiapkan sebagai slot kerja per fokus tim.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Setiap halaman sudah aktif dan siap diisi report, tabel, atau dashboard sesuai alur tim kamu.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Untuk sekarang tampilannya masih sengaja ringan supaya gampang kita bentuk ulang nanti.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Next step" description="Arah pengembangan setelah format final dibagikan.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Kita bisa tambahkan target, realisasi, trend harian, atau leaderboard per produk/konten.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Kalau sudah ada sumber data, tiap submenu bisa dinaikkan jadi workspace yang benar-benar operasional.</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <WorkspacePanel key={item.href} title={item.title} description={item.description}>
              <Link
                href={item.href}
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

export function ModulePlaceholder({
  intro,
  focusItems,
}: {
  intro: string;
  focusItems: string[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <WorkspacePanel title="Placeholder workspace" description={intro}>
        <div className="space-y-3">
          {focusItems.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Siap dipoles" description="Halaman ini sudah aktif dan tinggal menunggu format kerja final.">
        <div className="rounded-[24px] bg-slate-900 px-5 py-5 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Coming Soon</p>
          <p className="mt-2 text-xl font-semibold">Struktur dasar sudah siap.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Nanti kita bisa isi dengan tabel, scorecard, chart, funnel, atau daftar aktivitas sesuai kebutuhan modul ini.
          </p>
        </div>
      </WorkspacePanel>
    </div>
  );
}
