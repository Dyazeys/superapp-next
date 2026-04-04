"use client";

import Link from "next/link";
import { ArrowRight, Box, Boxes, ClipboardList, PackageCheck, PackageSearch, ScanSearch, Truck } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";

const warehouseSections = [
  {
    title: "Vendors",
    description: "Master vendor records reused by purchase orders and receiving.",
    href: "/warehouse/vendors",
    icon: Truck,
  },
  {
    title: "Purchase Orders",
    description: "PO registry with vendor references and inbound linkage.",
    href: "/warehouse/purchase-orders",
    icon: ClipboardList,
  },
  {
    title: "Inbound",
    description: "Receiving headers and QC lifecycle for delivered stock.",
    href: "/warehouse/inbound",
    icon: PackageCheck,
  },
  {
    title: "Inbound Items",
    description: "Inline receiving lines that post stock from passed QC quantities.",
    href: "/warehouse/inbound-items",
    icon: Boxes,
  },
  {
    title: "Adjustments",
    description: "Manual stock corrections with approval and movement sync.",
    href: "/warehouse/adjustments",
    icon: Box,
  },
  {
    title: "Stock Balances",
    description: "Current on-hand quantities from the existing warehouse ledger.",
    href: "/warehouse/stock-balances",
    icon: ScanSearch,
  },
  {
    title: "Stock Movements",
    description: "Movement ledger across inbound, adjustment, and sales flows.",
    href: "/warehouse/stock-movements",
    icon: PackageSearch,
  },
] as const;

export function WarehouseOverview() {
  return (
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
