"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Landmark, NotebookTabs } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const accountingSections = [
  {
    title: "Journals",
    description: "Read-first journal header list sourced from the existing accounting tables.",
    href: "/accounting/journals",
    icon: BookOpenText,
  },
  {
    title: "Journal Entries",
    description: "Detailed debit and credit lines tied to existing journal references.",
    href: "/accounting/journal-entries",
    icon: NotebookTabs,
  },
  {
    title: "Accounts",
    description: "Chart of accounts visibility with category and parent relationships.",
    href: "/accounting/accounts",
    icon: Landmark,
  },
] as const;

export function AccountingOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                Open sub-page
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </WorkspacePanel>
        );
      })}
    </div>
  );
}
