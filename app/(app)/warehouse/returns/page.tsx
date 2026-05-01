"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/foundation/page-shell";
import { WarehouseReturnWorkspace } from "@/features/warehouse/warehouse-return-workspace";
import type { WarehouseReturn } from "@/types/warehouse";

export default function WarehouseReturnsPage() {
  const [returns, setReturns] = useState<WarehouseReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/warehouse/returns");
      if (!response.ok) {
        throw new Error(`Failed to load returns: ${response.statusText}`);
      }
      const data = await response.json();
      setReturns(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Returns"
      description="Kelola retur barang dari pelanggan, termasuk verifikasi kondisi baik/rusak."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-500">Loading returns...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
          <button
            type="button"
            onClick={fetchReturns}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <WarehouseReturnWorkspace returns={returns} onRefresh={fetchReturns} />
      )}
    </PageShell>
  );
}