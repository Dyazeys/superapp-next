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
          "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
          level === 0 ? "font-semibold" : "font-medium",
          active
            ? level === 0
              ? exactActive
                ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
              : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
            : level === 0
              ? "text-slate-800 hover:bg-slate-50"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge ? <Badge variant="outline">{item.badge}</Badge> : null}
      </Link>
      {hasChildren ? (
        <div className={cn("space-y-1", level === 0 ? "ml-3 border-l border-slate-200 pl-3" : "ml-2 pl-2")}>
          {item.children?.map((child) => renderLink(child, pathname, level + 1))}
        </div>
      ) : null}
    </div>
  );
};

export function ModuleSidebar({ collapsed, modules, onToggle }: ModuleSidebarProps) {
  const pathname = usePathname();

  if (collapsed) return null;

  return (
    <aside className="flex h-screen flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Navigasi</p>
          <p className="text-lg font-semibold text-slate-900">ERP Modules</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse modules">
          <PanelLeftClose className="size-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {modules.map((item) => renderLink(item, pathname))}
      </div>
    </aside>
  );
}
