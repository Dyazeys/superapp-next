"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ModuleSidebarProps = {
  collapsed: boolean;
  modules: ModuleNavItem[];
  moduleTitle: string;
  onToggle: () => void;
};

const renderLink = (item: ModuleNavItem, pathname: string, level = 0) => {
  const Icon = item.icon;
  const exactActive = pathname === item.href;
  const descendantActive = pathname.startsWith(`${item.href}/`);
  const active = exactActive || descendantActive;
  const hasChildren = Boolean(item.children?.length);

  return (
    <div key={item.href} className="flex flex-col gap-1">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
          level === 0 ? "font-semibold" : "font-medium",
          active
            ? level === 0
              ? exactActive
                ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                : "bg-slate-100 text-slate-900 ring-1 ring-slate-300/70"
              : "bg-slate-100 text-slate-900 ring-1 ring-slate-300/70"
            : level === 0
              ? "text-slate-800 hover:bg-slate-100/80"
              : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge ? (
          <Badge
            variant="outline"
            className={cn(
              active ? "border-white/60 bg-white/10 text-white" : "border-slate-300/80 text-slate-700"
            )}
          >
            {item.badge}
          </Badge>
        ) : null}
      </Link>
      {hasChildren ? (
        <div
          className={cn(
            "space-y-1",
            level === 0 ? "ml-3 pl-3" : "ml-2 pl-2"
          )}
        >
          {item.children?.map((child) => renderLink(child, pathname, level + 1))}
        </div>
      ) : null}
    </div>
  );
};

export function ModuleSidebar({ collapsed, modules, moduleTitle, onToggle }: ModuleSidebarProps) {
  const pathname = usePathname();

  if (collapsed) return null;

  return (
    <aside className="flex h-screen flex-col bg-slate-50/60">
      <div className="m-3 flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Navigasi</p>
            <p className="text-lg font-semibold text-slate-900">{moduleTitle}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            onClick={onToggle}
            aria-label="Collapse modules"
          >
            <PanelLeftClose className="size-5" />
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {modules.map((item) => renderLink(item, pathname))}
        </div>
      </div>
    </aside>
  );
}
