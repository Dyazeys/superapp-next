"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OperationalExpenseBarterWorkspace } from "@/features/accounting/operational-expense-barter-workspace";
import { OperationalExpensesWorkspace } from "@/features/accounting/operational-expenses-workspace";

type OpexMode = "manual" | "barter";

function normalizeMode(value: string | null): OpexMode {
  return value === "barter" ? "barter" : "manual";
}

export function OperationalExpensesHub() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = normalizeMode(searchParams.get("mode"));

  const setMode = (nextMode: OpexMode) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMode === "manual") {
      params.delete("mode");
    } else {
      params.set("mode", nextMode);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border/80 bg-white/90 p-3 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Tampilan Opex</p>
            <p className="text-sm text-slate-600">Satu halaman untuk pindah antara input opex manual dan barter.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")}>
              Opex Manual
            </Button>
            <Button size="sm" variant={mode === "barter" ? "default" : "outline"} onClick={() => setMode("barter")}>
              Opex Barter
            </Button>
          </div>
        </div>
      </section>

      {mode === "barter" ? <OperationalExpenseBarterWorkspace /> : <OperationalExpensesWorkspace />}
    </div>
  );
}
