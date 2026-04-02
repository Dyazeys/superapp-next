"use client";

import { TOP_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type IconRailProps = {
  activeTop: (typeof TOP_NAV_ITEMS)[number]["id"];
  onSelect: (topId: (typeof TOP_NAV_ITEMS)[number]["id"]) => void;
};

export function IconRail({ activeTop, onSelect }: IconRailProps) {
  return (
    <nav className="flex h-full w-[72px] flex-col items-center gap-3 border-r border-slate-200 bg-white px-2 py-4 text-slate-500">
      <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
        <span className="text-xs font-semibold tracking-[0.3em] text-slate-600">ERP</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2">
        {TOP_NAV_ITEMS.map((item) => {
          const active = activeTop === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                item.disabled && "cursor-not-allowed opacity-40"
              )}
              onClick={() => !item.disabled && onSelect(item.id)}
              aria-label={item.label}
            >
              <item.icon className="size-5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
