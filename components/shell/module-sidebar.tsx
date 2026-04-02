"use client";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ERP_MODULE_ITEMS, ModuleNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ModuleSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const renderLink = (item: ModuleNavItem, pathname: string, level = 0) => {
  const Icon = item.icon;
  const active = pathname === item.href;

  return (
    <div key={item.href} className={cn("flex flex-col gap-1", level > 0 && "ml-4")}>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge ? <Badge variant="outline">{item.badge}</Badge> : null}
      </Link>
      {item.children?.map((child) => renderLink(child, pathname, level + 1))}
    </div>
  );
};

export function ModuleSidebar({ collapsed, onToggle }: ModuleSidebarProps) {
  const pathname = usePathname();

  if (collapsed) return null;

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">ERP Navigation</p>
          <p className="text-lg font-semibold text-slate-900">Enterprise Modules</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse modules">
          <PanelLeftClose className="size-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ERP_MODULE_ITEMS.map((item) => renderLink(item, pathname))}
      </div>
    </aside>
  );
}
