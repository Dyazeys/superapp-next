"use client";

import { PageShell } from "@/components/foundation/page-shell";
import { WarehouseReturnWorkspace } from "@/features/warehouse/warehouse-return-workspace";
import { useWarehouseReturns } from "@/features/warehouse/use-warehouse-module";

export default function WarehouseReturnsPage() {
  const { returnsQuery } = useWarehouseReturns();

  if (returnsQuery.isLoading) {
    return (
      <PageShell eyebrow="Warehouse" title="Returns" description="Kelola retur barang dari pelanggan, termasuk verifikasi kondisi baik/rusak.">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-500">Loading returns...</p>
        </div>
      </PageShell>
    );
  }

  if (returnsQuery.error) {
    return (
      <PageShell eyebrow="Warehouse" title="Returns" description="Kelola retur barang dari pelanggan, termasuk verifikasi kondisi baik/rusak.">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {returnsQuery.error instanceof Error ? returnsQuery.error.message : "Failed to load returns"}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Warehouse" title="Returns" description="Kelola retur barang dari pelanggan, termasuk verifikasi kondisi baik/rusak.">
      <WarehouseReturnWorkspace returns={returnsQuery.data ?? []} />
    </PageShell>
  );
}
