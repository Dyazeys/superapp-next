"use client";

import { useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImportMode = "upsert" | "skip_duplicate";

type BomTxtImportResult = {
  mode: ImportMode;
  summary: {
    total_templates: number;
    total_skus_targeted: number;
    matched_skus: number;
    processed_rows: number;
    created_rows: number;
    updated_rows: number;
    skipped_rows: number;
    error_rows: number;
  };
  errors: Array<{
    product_name: string;
    sku: string;
    rule_index: number;
    row_index: number;
    message: string;
  }>;
};

export function BomTxtImportWorkspace() {
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BomTxtImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitImport() {
    if (!file) {
      setError("Pilih file TXT dulu.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch("/api/imports/bom-template-txt", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as BomTxtImportResult | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Import failed.");
      }

      setResult(payload as BomTxtImportResult);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Import failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Master Data"
      title="BOM TXT Import (Temporary)"
      description="Upload template TXT (JSON text) untuk apply BOM massal per product_name ke semua SKU yang cocok marker inv_main / inv_acc."
    >
      <div className="space-y-5">
        <section className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
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

            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium tracking-[0.02em] text-foreground/80">File template TXT</span>
              <Input
                type="file"
                accept=".txt,.json,text/plain,application/json"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={submitImport} disabled={!file || isSubmitting}>
              {isSubmitting ? "Importing..." : "Upload & Apply Template"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Format yang didukung: template gabungan (`products`) atau single product (`product`).
            </p>
          </div>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </section>

        <section className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Import Summary</h2>
          {!result ? (
            <EmptyState title="Belum ada hasil import" description="Upload template TXT untuk melihat ringkasan hasil apply BOM." />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Mode <span className="font-medium text-foreground">{result.mode}</span>.
              </p>

              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div>Total templates: {result.summary.total_templates}</div>
                <div>Total SKU targeted: {result.summary.total_skus_targeted}</div>
                <div>Matched SKU: {result.summary.matched_skus}</div>
                <div>Processed rows: {result.summary.processed_rows}</div>
                <div>Created: {result.summary.created_rows}</div>
                <div>Updated: {result.summary.updated_rows}</div>
                <div>Skipped: {result.summary.skipped_rows}</div>
                <div>Errors: {result.summary.error_rows}</div>
              </div>

              {result.errors.length > 0 ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs font-medium tracking-[0.02em] text-foreground/80">Row errors</p>
                  <ul className="mt-2 space-y-1 text-sm text-destructive">
                    {result.errors.slice(0, 200).map((item, index) => (
                      <li key={`${item.product_name}-${item.sku}-${item.rule_index}-${item.row_index}-${index}`}>
                        {item.product_name} | SKU {item.sku} | rule {item.rule_index} row {item.row_index}: {item.message}
                      </li>
                    ))}
                  </ul>
                  {result.errors.length > 200 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Menampilkan 200 error pertama dari total {result.errors.length} error.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
