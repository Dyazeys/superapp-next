"use client";

import { TOP_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type IconRailProps = {
  activeTop: (typeof TOP_NAV_ITEMS)[number]["id"];
  onSelect: (topId: (typeof TOP_NAV_ITEMS)[number]["id"]) => void;
};

export function IconRail({ activeTop, onSelect }: IconRailProps) {
  return (
    <nav className="flex h-screen w-[84px] shrink-0 flex-col items-center gap-4 bg-slate-50/80 px-3 py-5 text-slate-500 backdrop-blur">
      <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
        <div className="grid grid-cols-2 gap-1.5">
          <span className="size-1.5 rounded-full bg-white/90" />
          <span className="size-1.5 rounded-full bg-white/70" />
          <span className="size-1.5 rounded-full bg-white/70" />
          <span className="size-1.5 rounded-full bg-white/90" />
        </div>
        <span className="sr-only">Brand logo</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-around rounded-3xl bg-slate-900 px-2 py-3 shadow-sm">
        {TOP_NAV_ITEMS.map((item) => {
          const active = activeTop === item.id;

          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200",
                active
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-900/30"
                  : "bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white",
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
