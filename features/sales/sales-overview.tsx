"use client";

import Link from "next/link";
import { ArrowRight, Boxes, ReceiptText, Users } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const salesSections = [
  {
    title: "Sales Orders",
    description: "Order header CRUD with existing stock-posting and accounting integrations preserved.",
    href: "/sales/orders",
    icon: ReceiptText,
  },
  {
    title: "Sales Order Items",
    description: "Inline item editing that reuses the current warehouse movement posting behavior.",
    href: "/sales/order-items",
    icon: Boxes,
  },
  {
    title: "Channels",
    description: "Sales channel lookup records already exposed by the current API.",
    href: "/sales/channels",
    icon: Users,
  },
] as const;

export function SalesOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
