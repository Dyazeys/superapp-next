import {
  Users, Zap, Coffee, Car, Package, Gift,
  GraduationCap, Truck, FlaskConical, Building2, Wrench,
} from "lucide-react";
import type { BudgetMeterGroup, BudgetSubItem } from "@/lib/budget-meter";

export function currency(value: number) {
  return "Rp" + new Intl.NumberFormat("id-ID").format(value);
}

export function Bar({ pct, over, dark }: { pct: number; over: boolean; dark?: boolean }) {
  const w = Math.min(pct, 100);
  const color = over || pct >= 100
    ? "bg-red-500"
    : pct >= 85
      ? "bg-orange-500"
      : pct >= 60
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-slate-100"}`}>
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "62101": Users,
  "62102": Zap,
  "62103": Coffee,
  "62104": Car,
  "62105": Package,
  "62106": Gift,
  "62107": GraduationCap,
  "62108": Truck,
  "62109": FlaskConical,
  "62110": Building2,
  "62111": Wrench,
};

function accentClasses(pct: number, over: boolean) {
  if (over || pct >= 100) return { border: "border-l-red-500", bg: "bg-red-50", icon: "text-red-600", iconBg: "bg-red-100" };
  if (pct >= 85) return { border: "border-l-orange-500", bg: "bg-orange-50", icon: "text-orange-600", iconBg: "bg-orange-100" };
  if (pct >= 60) return { border: "border-l-amber-500", bg: "bg-amber-50", icon: "text-amber-600", iconBg: "bg-amber-100" };
  return { border: "border-l-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600", iconBg: "bg-emerald-100" };
}

export function GroupCard({ group }: { group: BudgetMeterGroup }) {
  const over = group.variance < 0;
  const ac = accentClasses(group.usagePercent, over);
  const Icon = GROUP_ICONS[group.code];

  return (
    <div className={`rounded-2xl border border-slate-200/60 bg-white px-3.5 py-3 shadow-sm border-l-[3px] ${ac.border}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl border border-transparent p-1.5 ${ac.iconBg} ${ac.icon}`}>
            <Icon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{group.label}</h3>
            <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {group.code}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Budget</p>
          <p className="font-semibold tabular-nums text-slate-900">{currency(group.budget)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Realisasi</p>
          <p className="font-semibold tabular-nums text-slate-900">{currency(group.realisasi)}</p>
        </div>
        <div className={`rounded-lg px-2 py-1 ${over ? "bg-red-50" : "bg-emerald-50"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Variance</p>
          <p className={`font-semibold tabular-nums ${over ? "text-red-700" : "text-emerald-700"}`}>
            {over ? "" : "+"}{currency(group.variance)}
          </p>
        </div>
      </div>

      <div className="mt-2.5">
        <Bar pct={group.usagePercent} over={over} />
      </div>

      {group.items.length > 0 && (
        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Item</span>
            <span className="text-right">Budget</span>
            <span className="text-right">Realisasi</span>
          </div>
          <div className="mt-0.5 -mx-2 space-y-0.5">
            {group.items.map((item: BudgetSubItem, i: number) => (
              <div
                key={item.label}
                className={`grid grid-cols-[1fr_auto_auto] gap-x-3 rounded-lg px-1.5 py-1 text-sm ${i % 2 === 0 ? "" : "bg-slate-50/60"}`}
              >
                <span className="text-slate-600">{item.label}</span>
                <span className="text-right text-slate-500">{currency(item.budget)}</span>
                <span className="text-right font-medium text-slate-900">{currency(item.realisasi)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
