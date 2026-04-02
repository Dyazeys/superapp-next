"use client";

import { Button } from "@/components/ui/button";
import { IconRail } from "@/components/shell/icon-rail";
import { ModuleSidebar } from "@/components/shell/module-sidebar";
import { TOP_NAV_ITEMS, ERP_MODULE_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTop, setActiveTop] = useState(TOP_NAV_ITEMS[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const sidebarModules = activeTop === "erp" ? ERP_MODULE_ITEMS : [];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <IconRail activeTop={activeTop} onSelect={(top) => { setActiveTop(top); setSidebarCollapsed(false); }} />

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("transition-all duration-200", sidebarCollapsed ? "w-0" : "w-[260px]")}>
          {!sidebarCollapsed && (
            <ModuleSidebar
              collapsed={sidebarCollapsed}
              modules={sidebarModules}
              onToggle={() => setSidebarCollapsed(true)}
            />
          )}
        </div>

        <div className="flex-1">
          {sidebarCollapsed && (
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <span className="text-sm uppercase tracking-[0.35em] text-slate-500">Modules hidden</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setSidebarCollapsed(false)} aria-label="Show modules">
                <PanelLeftOpen className="size-4" />
              </Button>
            </div>
          )}
          <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{activeTop.toUpperCase()}</p>
                  <h1 className="text-2xl font-semibold text-slate-900">ERP Workspace</h1>
                </div>
                <p className="text-sm text-slate-500">{pathname}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
