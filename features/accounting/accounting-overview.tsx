"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Landmark, NotebookTabs, Wallet } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const accountingSections = [
  {
    title: "Journals",
    description: "Daftar jurnal (read-first) dari tabel akuntansi yang sudah ada.",
    href: "/accounting/journals",
    icon: BookOpenText,
  },
  {
    title: "Journal Entries",
    description: "Detail debit/kredit untuk rekonsiliasi cepat berdasarkan referensi jurnal.",
    href: "/accounting/journal-entries",
    icon: NotebookTabs,
  },
  {
    title: "Accounts",
    description: "Chart of accounts dengan kategori dan relasi parent.",
    href: "/accounting/accounts",
    icon: Landmark,
  },
  {
    title: "Channel Report",
    description: "Ringkasan accounting per channel berbasis jurnal yang sudah ada.",
    href: "/accounting/channel-report",
    icon: Wallet,
  },
] as const;

export function AccountingOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Panduan cepat" description="Mulai dari yang paling sering dipakai.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Gunakan Journals untuk melihat sumber dan periodisasi.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Masuk ke Journal Entries saat butuh detail debit/kredit.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Struktur akun" description="Memudahkan mapping dan analisis.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Accounts menampilkan COA beserta relasi parent.</p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Catatan" description="Tidak ada perubahan pada proses bisnis.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-slate-400" />
              <p>Modul ini fokus tampilan (read-first) dari data yang sudah ada.</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {accountingSections.map((section) => {
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
