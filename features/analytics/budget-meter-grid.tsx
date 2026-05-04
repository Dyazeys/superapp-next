"use client";

import { useState } from "react";
import type { BudgetMeterGroup } from "@/lib/budget-meter";
import { GroupCard } from "@/components/budget-meter/budget-group-card";

export function BudgetMeterGrid({ groups }: { groups: BudgetMeterGroup[] }) {
  const [overBudgetOnly, setOverBudgetOnly] = useState(false);

  const overCount = groups.filter((g) => g.variance < 0).length;
  const filtered = overBudgetOnly ? groups.filter((g) => g.variance < 0) : groups;

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 text-sm">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            !overBudgetOnly
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setOverBudgetOnly(false)}
        >
          Semua
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            overBudgetOnly
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setOverBudgetOnly(true)}
        >
          Over Budget
          {overCount > 0 && (
            <span
              className={`ml-1.5 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                overBudgetOnly
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {overCount}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white px-5 py-10 text-center text-sm text-slate-400">
          Tidak ada grup yang over budget bulan ini.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((group) => (
            <GroupCard key={group.code} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
