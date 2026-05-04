"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { salesApi, type ImportReviewResult } from "@/features/sales/api";

function downloadTemplate() {
  const headers = [
    "order_no", "order_date", "ref_no", "channel_id", "customer_id",
    "sku", "qty", "unit_price", "discount_item", "status", "is_historical",
  ];
  const sample =
    "ORD-001,2025-01-15,,,1,SKU-A,10,50000,0,PICKUP,false\nORD-002,2025-01-16,REF-001,2,2,SKU-B,5,75000,0,SUKSES,false";

  const csv = `${headers.join(",")}\n${sample}`;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-sales-orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type SalesOrderCsvImportProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function SalesOrderCsvImport({ open, onOpenChange, onSuccess }: SalesOrderCsvImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reviewResult, setReviewResult] = useState<ImportReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setReviewResult(null);
  }

  async function handleReview() {
    if (!file) return;
    setIsReviewing(true);
    try {
      const result = await salesApi.orders.importCsv(file, true) as ImportReviewResult;
      setReviewResult(result);
      if (result.valid) {
        toast.success(`${result.orderCount} order siap diimport.`);
      } else {
        toast.error(`${result.errors.length} error ditemukan.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Review CSV gagal.");
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleUpload() {
    if (!file || !reviewResult?.valid) return;
    setIsUploading(true);
    try {
      const result = await salesApi.orders.importCsv(file) as { success: boolean; orders: number; items: number };
      toast.success(`${result.orders} order (${result.items} item) berhasil diimport.`);
      onSuccess?.();
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload CSV gagal.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleClose(open: boolean) {
    onOpenChange(open);
    if (!open) {
      setFile(null);
      setReviewResult(null);
    }
  }

  const hasErrors = reviewResult && !reviewResult.valid;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import CSV Sales Orders</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Pilih file CSV</label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <FileText className="size-4 shrink-0 text-slate-400" />
                <span className={file ? "text-slate-900" : "text-slate-400"}>
                  {file ? file.name : "Belum ada file dipilih"}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Browse
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
          >
            <Download className="size-3.5" />
            Download template CSV
          </button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            <p className="mb-1 font-medium text-slate-700">Kolom CSV</p>
            <p>
              <span className="font-medium text-slate-800">Wajib:</span>{" "}
              order_no, order_date, sku, qty, unit_price, status
            </p>
            <p>
              <span className="font-medium text-slate-800">Opsional:</span>{" "}
              ref_no, channel_id, customer_id, discount_item, is_historical
            </p>
          </div>

          {reviewResult ? (
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                Hasil Review
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Baris:</span>
                  <span className="font-medium text-slate-900">{reviewResult.totalRows}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">Order:</span>
                  <span className="font-medium text-slate-900">{reviewResult.orderCount}</span>
                  <span className="text-slate-300">|</span>
                  {hasErrors ? (
                    <>
                      <AlertTriangle className="size-3.5 text-amber-600" />
                      <span className="font-medium text-amber-700">{reviewResult.errors.length} error</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span className="font-medium text-emerald-700">Valid</span>
                    </>
                  )}
                </div>
                {hasErrors ? (
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {reviewResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        ▸ Baris {err.row} ({err.order_no}): {err.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Batal
          </Button>
          <Button type="button" variant="secondary" disabled={!file || isReviewing} onClick={handleReview}>
            {isReviewing ? "Memproses..." : "Review"}
          </Button>
          <Button type="button" disabled={!reviewResult?.valid || isUploading} onClick={handleUpload}>
            <Upload className="size-4" />
            {isUploading ? "Mengupload..." : "Upload CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
