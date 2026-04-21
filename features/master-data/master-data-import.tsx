"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MasterKey = "channel" | "customer" | "product_category" | "product" | "product_bom" | "inventory" | "vendor";
type ImportMode = "upsert" | "skip_duplicate";

type ImportResult = {
  master: MasterKey;
  mode: ImportMode;
  summary: {
    total_rows: number;
    success_rows: number;
    created_rows: number;
    updated_rows: number;
    skipped_rows: number;
    error_rows: number;
  };
  errors: Array<{
    row: number;
    message: string;
  }>;
};

const MASTER_OPTIONS: Array<{
  key: MasterKey;
  label: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
}> = [
  {
    key: "channel",
    label: "Channel",
    description: "Master channel dan mapping kategori/akun.",
    requiredColumns: ["channel_name"],
    optionalColumns: [
      "channel_id",
      "slug",
      "is_marketplace",
      "category_name",
      "group_name",
      "piutang_account_code",
      "revenue_account_code",
      "saldo_account_code",
    ],
  },
  {
    key: "customer",
    label: "Customer",
    description: "Master customer non-transaksi.",
    requiredColumns: ["customer_name"],
    optionalColumns: ["customer_id", "phone", "email", "is_active"],
  },
  {
    key: "product_category",
    label: "Product Category",
    description: "Master kategori produk.",
    requiredColumns: ["category_code", "category_name"],
    optionalColumns: ["parent_category_code", "is_active"],
  },
  {
    key: "product",
    label: "Product",
    description: "Master produk/SKU.",
    requiredColumns: ["sku", "sku_name", "product_name"],
    optionalColumns: [
      "category_code",
      "color",
      "color_code",
      "size",
      "variations",
      "busa_code",
      "inv_main",
      "inv_acc",
      "is_bundling",
      "is_active",
      "total_hpp",
    ],
  },
  {
    key: "product_bom",
    label: "Product BOM",
    description: "Update baris BOM existing per SKU. Import ini tidak membuat row BOM baru jika key dedup tidak ketemu.",
    requiredColumns: [
      "sku",
      "component_group",
      "component_type",
      "component_name",
      "qty",
      "unit_cost",
      "is_stock_tracked",
      "sequence_no",
      "is_active",
    ],
    optionalColumns: ["inv_code", "notes"],
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Master inventory/bahan.",
    requiredColumns: ["inv_code", "inv_name", "unit_price"],
    optionalColumns: ["description", "is_active"],
  },
  {
    key: "vendor",
    label: "Vendor",
    description: "Master vendor warehouse.",
    requiredColumns: ["vendor_code", "vendor_name"],
    optionalColumns: ["pic_name", "phone", "address", "is_active"],
  },
];

export function MasterDataImportWorkspace() {
  const [selectedMaster, setSelectedMaster] = useState<MasterKey>("channel");
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedMasterMeta = useMemo(
    () => MASTER_OPTIONS.find((item) => item.key === selectedMaster)!,
    [selectedMaster]
  );

  async function submitImport() {
    if (!file) {
      setError("Pilih file CSV dulu.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch(`/api/imports/master-data/${selectedMaster}`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ImportResult | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Import failed.");
      }

      setResult(payload as ImportResult);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Import failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Master Data"
      title="CSV Import"
      description="Import CSV untuk master data dan update BOM. Alur ini tidak menyentuh tabel transaksi."
    >
      <div className="space-y-5">
        <section className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium tracking-[0.02em] text-foreground/80">Master target</span>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                value={selectedMaster}
                onChange={(event) => setSelectedMaster(event.target.value as MasterKey)}
              >
                {MASTER_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium tracking-[0.02em] text-foreground/80">Mode duplicate</span>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                value={mode}
                onChange={(event) => setMode(event.target.value as ImportMode)}
              >
                <option value="upsert">upsert (update jika sudah ada)</option>
                <option value="skip_duplicate">skip_duplicate (lewati jika sudah ada)</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium tracking-[0.02em] text-foreground/80">File CSV</span>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <Button onClick={submitImport} disabled={!file || isSubmitting}>
              {isSubmitting ? "Importing..." : "Upload & Import"}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </section>

        <section className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
          <h2 className="text-sm font-semibold">{selectedMasterMeta.label} CSV Format</h2>
          <p className="mt-1 text-sm text-muted-foreground">{selectedMasterMeta.description}</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-[0.02em] text-foreground/80">Required columns</p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedMasterMeta.requiredColumns.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.02em] text-foreground/80">Optional columns</p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedMasterMeta.optionalColumns.join(", ")}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Template: lihat folder <code>docs/imports/master-data/templates/</code>.
          </p>
        </section>

        <section className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Import Summary</h2>
          {!result ? (
            <EmptyState title="Belum ada hasil import" description="Upload file CSV untuk melihat ringkasan hasil per baris." />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Target <span className="font-medium text-foreground">{result.master}</span> dengan mode{" "}
                <span className="font-medium text-foreground">{result.mode}</span>.
              </p>
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div>Total rows: {result.summary.total_rows}</div>
                <div>Success: {result.summary.success_rows}</div>
                <div>Errors: {result.summary.error_rows}</div>
                <div>Created: {result.summary.created_rows}</div>
                <div>Updated: {result.summary.updated_rows}</div>
                <div>Skipped: {result.summary.skipped_rows}</div>
              </div>

              {result.errors.length > 0 ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs font-medium tracking-[0.02em] text-foreground/80">Row errors</p>
                  <ul className="mt-2 space-y-1 text-sm text-destructive">
                    {result.errors.map((item) => (
                      <li key={`${item.row}-${item.message}`}>Row {item.row}: {item.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
