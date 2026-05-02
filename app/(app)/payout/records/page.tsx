"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { CalendarDays, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { formatMoney, formatShortDate } from "@/lib/format";
import { normalizePayoutStatus } from "@/lib/payout-status";
import {
  PAYOUT_STATUS_OPTIONS,
  payoutStatusTone,
  sumPayoutDeductions,
  usePayoutOrders,
  usePayouts,
} from "@/features/payout/use-payout-module";
import type { PayoutInput } from "@/schemas/payout-module";
import type { PayoutRecord } from "@/types/payout";
import { toast } from "sonner";
import { useModalState } from "@/hooks/use-modal-state";

const payoutColumnHelper = createColumnHelper<PayoutRecord>();

type RecordPageFilter = {
  ref: string | null;
  channelId: number | null;
  payoutId: number | null;
};

type CsvReviewResponse = {
  ok: boolean;
  reviewOnly: boolean;
  summary: {
    totalRows: number;
    validRows: number;
    insertedEstimate?: number;
    updatedEstimate?: number;
    inserted?: number;
    updated?: number;
    errorCount: number;
  };
  errors?: Array<{ row: number; ref?: string; reason: string }>;
};

function getRecordPageFilter(): RecordPageFilter {
  if (typeof window === "undefined") {
    return { ref: null, channelId: null, payoutId: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const channelId = Number(searchParams.get("channel_id") ?? "");
  const payoutId = Number(searchParams.get("payout_id") ?? "");

  return {
    ref: searchParams.get("ref") || null,
    channelId: Number.isFinite(channelId) && channelId > 0 ? channelId : null,
    payoutId: Number.isFinite(payoutId) && payoutId > 0 ? payoutId : null,
  };
}

function toNumericInputValue(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatCalculatedValue(value: number) {
  return value.toFixed(2);
}

function formatMoneyNoDecimals(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return `Rp${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))}`;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Memuat data payout...</p>
      </div>
    </div>
  );
}

function ErrorBanner({ error }: { error: Error }) {
  return (
    <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-semibold text-red-800">Gagal memuat data payout</p>
      <p className="mt-1 text-sm text-red-600">{error.message}</p>
    </div>
  );
}

export default function PayoutRecordsPage() {
  const hooks = usePayouts();
  const orderLookupQuery = usePayoutOrders();
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const [pageFilter] = useState<RecordPageFilter>(() => getRecordPageFilter());
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SETTLED" | "FAILED">("ALL");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isReviewingCsv, setIsReviewingCsv] = useState(false);
  const [csvReview, setCsvReview] = useState<CsvReviewResponse | null>(null);
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<number[]>([]);
  const uploadCsvModal = useModalState();

  const baseRows = useMemo(
    () =>
      (hooks.payoutsQuery.data ?? []).filter((payout) => {
        if (pageFilter.ref && payout.ref !== pageFilter.ref) {
          return false;
        }

        if (pageFilter.channelId && payout.t_order?.m_channel?.channel_id !== pageFilter.channelId) {
          return false;
        }

        if (pageFilter.payoutId && payout.payout_id !== pageFilter.payoutId) {
          return false;
        }

        return true;
      }),
    [hooks.payoutsQuery.data, pageFilter.channelId, pageFilter.payoutId, pageFilter.ref]
  );
  const payoutRows = useMemo(
    () =>
      baseRows.filter((row) => {
        const normalizedStatus = normalizePayoutStatus(row.payout_status) ?? "";
        if (statusFilter !== "ALL" && normalizedStatus !== statusFilter) {
          return false;
        }

        const payoutDate = String(row.payout_date ?? "").slice(0, 10);
        if (dateFromFilter && payoutDate < dateFromFilter) {
          return false;
        }
        if (dateToFilter && payoutDate > dateToFilter) {
          return false;
        }
        return true;
      }),
    [baseRows, dateFromFilter, dateToFilter, statusFilter]
  );
  const totalPayouts = payoutRows.length;
  const settledCount = payoutRows.filter((row) => normalizePayoutStatus(row.payout_status) === "SETTLED").length;
  const failedCount = payoutRows.filter((row) => normalizePayoutStatus(row.payout_status) === "FAILED").length;
  const totalGross = payoutRows.reduce((sum, row) => sum + Number(row.total_price), 0);
  const totalNet = payoutRows.reduce((sum, row) => sum + Number(row.omset), 0);

  const grossAmount = toNumericInputValue(hooks.payoutForm.watch("total_price"));
  const sellerDiscount = toNumericInputValue(hooks.payoutForm.watch("seller_discount"));
  const amountAfterDiscount = Math.max(0, grossAmount - sellerDiscount);
  const netPayout = toNumericInputValue(hooks.payoutForm.watch("omset"));
  const hppAmount = toNumericInputValue(hooks.payoutForm.watch("hpp"));
  const marginAmount = netPayout - hppAmount;
  const selectableRows = payoutRows.filter((row) => (row.post_status ?? "DRAFT") === "DRAFT");
  const selectableIdSet = new Set(selectableRows.map((row) => row.payout_id));
  const selectedDeletableIds = selectedPayoutIds.filter((id) => selectableIdSet.has(id));
  const allSelectableChecked = selectableRows.length > 0 && selectedDeletableIds.length === selectableRows.length;
  const someSelectableChecked = selectedDeletableIds.length > 0 && !allSelectableChecked;

  const payoutColumns = [
    payoutColumnHelper.display({
      id: "select",
      header: () => (
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={allSelectableChecked}
          ref={(el) => {
            if (el) el.indeterminate = someSelectableChecked;
          }}
          onChange={(event) => {
            if (event.target.checked) {
              setSelectedPayoutIds(selectableRows.map((row) => row.payout_id));
            } else {
              setSelectedPayoutIds([]);
            }
          }}
          aria-label="Pilih semua payout draft"
        />
      ),
      cell: ({ row }) => {
        const isDraft = (row.original.post_status ?? "DRAFT") === "DRAFT";
        return (
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={selectedPayoutIds.includes(row.original.payout_id)}
            disabled={!isDraft}
            onChange={(event) => {
              setSelectedPayoutIds((current) => {
                if (event.target.checked) {
                  return Array.from(new Set([...current, row.original.payout_id]));
                }
                return current.filter((id) => id !== row.original.payout_id);
              });
            }}
            aria-label={`Pilih payout ${row.original.ref ?? row.original.payout_id}`}
          />
        );
      },
    }),
    payoutColumnHelper.accessor("ref", {
      header: "Referensi",
      cell: ({ row, getValue }) => {
        const isDraft = (row.original.post_status ?? "DRAFT") === "DRAFT";
        return (
          <div>
            <button
              type="button"
              className="block font-medium text-left text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => hooks.openPayoutModal(row.original)}
              disabled={!isDraft}
            >
              {getValue() ?? "-"}
            </button>
          {row.original.t_order?.order_no ? (
            <button
              type="button"
              className="mt-0.5 block text-left text-xs text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => hooks.openPayoutModal(row.original)}
              disabled={!isDraft}
            >
              {row.original.t_order.order_no}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Tanpa order</p>
          )}
          <p className="text-xs text-muted-foreground">{row.original.t_order?.m_channel?.channel_name ?? "Tanpa channel"}</p>
          </div>
        );
      },
    }),
    payoutColumnHelper.accessor("payout_date", {
      header: "Tanggal payout",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    payoutColumnHelper.accessor("total_price", {
      header: "Bruto",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    payoutColumnHelper.display({
      id: "deductions",
      header: "Potongan / Biaya",
      cell: ({ row }) => formatMoney(sumPayoutDeductions(row.original)),
    }),
    payoutColumnHelper.accessor("omset", {
      header: "Payout Bersih",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    payoutColumnHelper.accessor("payout_status", {
      header: "Status",
      cell: (info) => (
        <StatusBadge
          label={normalizePayoutStatus(info.getValue()) ?? "Tidak diketahui"}
          tone={payoutStatusTone(info.getValue())}
        />
      ),
    }),
    payoutColumnHelper.accessor("post_status", {
      header: "Post",
      cell: (info) => {
        const status = String(info.getValue() ?? "DRAFT").toUpperCase();
        return (
          <StatusBadge
            label={status}
            tone={
              status === "LOCKED"
                ? "warning"
                : status === "VOID"
                  ? "danger"
                  : status === "POSTED"
                    ? "success"
                    : "neutral"
            }
          />
        );
      },
    }),
    payoutColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {(row.original.post_status ?? "DRAFT") === "DRAFT" ? (
            <Button size="sm" variant="outline" onClick={() => void hooks.changeLifecycle(row.original.payout_id, "POST")}>
              Post
            </Button>
          ) : null}
          {(row.original.post_status ?? "DRAFT") === "POSTED" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => void hooks.changeLifecycle(row.original.payout_id, "LOCK")}>
                Lock
              </Button>
              <Button size="sm" variant="outline" onClick={() => void hooks.changeLifecycle(row.original.payout_id, "VOID")}>
                Void
              </Button>
            </>
          ) : null}
          {(row.original.post_status ?? "DRAFT") === "LOCKED" ? (
            <Button size="sm" variant="outline" onClick={() => void hooks.changeLifecycle(row.original.payout_id, "VOID")}>
              Void
            </Button>
          ) : null}
        </div>
      ),
    }),
  ];

  async function handleReviewCsv() {
    if (!csvFile) {
      toast.error("Pilih file CSV dulu.");
      return;
    }

    try {
      setIsReviewingCsv(true);
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch("/api/payout/records/import-csv?review=1", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? "Upload CSV gagal.");
      }

      const result = (await response.json()) as CsvReviewResponse;
      setCsvReview(result);
      if (result.ok) {
        toast.success("Review file valid. Kamu bisa lanjut upload.");
      } else {
        toast.error(`Review menemukan ${result.summary.errorCount} error.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review CSV gagal.");
    } finally {
      setIsReviewingCsv(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedDeletableIds.length === 0) {
      toast.error("Pilih data DRAFT yang mau dihapus dulu.");
      return;
    }

    try {
      await Promise.all(selectedDeletableIds.map((id) => hooks.deletePayout(id)));
      setSelectedPayoutIds([]);
      toast.success(`${selectedDeletableIds.length} payout berhasil dihapus.`);
      await hooks.payoutsQuery.refetch();
    } catch {
      // toast sudah ditangani di hook
    }
  }

  async function handleUploadCsv() {
    if (!csvFile) {
      toast.error("Pilih file CSV dulu.");
      return;
    }
    if (!csvReview?.ok) {
      toast.error("Review dulu file CSV sampai valid sebelum upload.");
      return;
    }

    try {
      setIsUploadingCsv(true);
      const formData = new FormData();
      formData.append("file", csvFile);
      const response = await fetch("/api/payout/records/import-csv", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; summary?: { errorCount?: number } } | null;
        throw new Error(payload?.error ?? "Upload CSV gagal.");
      }
      const result = (await response.json()) as CsvReviewResponse;
      toast.success(`Import selesai. Insert ${result.summary.inserted ?? 0}, update ${result.summary.updated ?? 0}.`);
      setCsvFile(null);
      setCsvReview(null);
      uploadCsvModal.closeModal();
      await Promise.all([hooks.payoutsQuery.refetch(), orderLookupQuery.refetch()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload CSV gagal.");
    } finally {
      setIsUploadingCsv(false);
    }
  }

  const isLoading = isClientReady && hooks.payoutsQuery.isLoading;
  const isError = hooks.payoutsQuery.isError;
  const error = hooks.payoutsQuery.error;

  return (
    <PageShell
      eyebrow="Payout"
      title="Data Payout"
      description="Kelola data payout untuk memantau bruto, bersih, status, dan relasi order tanpa otomatisasi baru."
    >
      <datalist id="payout-record-refs">
        {(orderLookupQuery.data ?? []).map((order) =>
          order.ref_no ? (
            <option key={order.order_no} value={order.ref_no}>
              {order.order_no} / {order.m_channel?.channel_name ?? "Tanpa channel"}
            </option>
          ) : null
        )}
      </datalist>

      <div className="space-y-5">
        {pageFilter.ref || pageFilter.channelId || pageFilter.payoutId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Menampilkan payout dengan filter
              {pageFilter.ref ? ` ref ${pageFilter.ref}` : ""}
              {pageFilter.ref && (pageFilter.channelId || pageFilter.payoutId) ? "," : ""}
              {pageFilter.channelId ? ` channel #${pageFilter.channelId}` : ""}
              {pageFilter.channelId && pageFilter.payoutId ? "," : ""}
              {pageFilter.payoutId ? ` payout #${pageFilter.payoutId}` : ""}.
            </p>
            <Link
              href="/payout/records"
              className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              Lihat semua payout
            </Link>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total payout" value={String(totalPayouts)} subtitle="Jumlah payout yang terlihat." />
          <MetricCard
            title="Status payout"
            value={`${settledCount} / ${failedCount}`}
            subtitle="SETTLED / FAILED"
            valueClassName="text-[clamp(1.25rem,1.6vw,1.75rem)]"
          />
          <MetricCard
            title="Total bruto"
            value={formatMoneyNoDecimals(totalGross)}
            subtitle="Akumulasi bruto dari data yang terlihat."
            valueClassName="text-[clamp(1.8rem,2vw,2.3rem)]"
          />
          <MetricCard
            title="Total bersih"
            value={formatMoneyNoDecimals(totalNet)}
            subtitle="Akumulasi payout bersih dari data yang terlihat."
            valueClassName="text-[clamp(1.8rem,2vw,2.3rem)]"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div className="grid w-full gap-3 md:max-w-[860px] md:grid-cols-3">
            <FormField label="Status" htmlFor="filter-status">
              <SelectNative
                id="filter-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "ALL" | "SETTLED" | "FAILED")}
              >
                <option value="ALL">Semua status</option>
                <option value="SETTLED">SETTLED</option>
                <option value="FAILED">FAILED</option>
              </SelectNative>
            </FormField>
            <FormField label="Tanggal dari" htmlFor="filter-date-from">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-date-from"
                  type="date"
                  value={dateFromFilter}
                  className="h-10 rounded-xl pr-10 pl-9"
                  onChange={(event) => setDateFromFilter(event.target.value)}
                />
                {dateFromFilter ? (
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setDateFromFilter("")}
                    aria-label="Hapus tanggal dari"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </FormField>
            <FormField label="Tanggal sampai" htmlFor="filter-date-to">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-date-to"
                  type="date"
                  value={dateToFilter}
                  className="h-10 rounded-xl pr-10 pl-9"
                  onChange={(event) => setDateToFilter(event.target.value)}
                />
                {dateToFilter ? (
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setDateToFilter("")}
                    aria-label="Hapus tanggal sampai"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </FormField>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={uploadCsvModal.openModal}>
              Upload CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatusFilter("ALL");
                setDateFromFilter("");
                setDateToFilter("");
              }}
            >
              Reset filter
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[20px] border border-border/70 bg-card/80 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Terpilih: {selectedDeletableIds.length} payout draft
          </p>
          <Button variant="outline" disabled={selectedDeletableIds.length === 0} onClick={() => void handleDeleteSelected()}>
            <Trash2 className="size-4" />
            Hapus terpilih
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorBanner error={error instanceof Error ? error : new Error(error ? String(error) : "Unknown error")} />
        ) : (
          <DataTable
            columns={payoutColumns}
            data={payoutRows}
            emptyMessage="Belum ada data payout."
            pagination={{ enabled: true, pageSize: 15, pageSizeOptions: [10, 15, 25, 50] }}
          />
        )}
      </div>

      <Dialog
        open={uploadCsvModal.open}
        onOpenChange={(open) => {
          uploadCsvModal.setOpen(open);
          if (!open) {
            setCsvFile(null);
            setCsvReview(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Upload CSV payout</DialogTitle>
            <DialogDescription>
              Import data payout harian dari CSV admin. Data akan di-upsert berdasarkan `ref`.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField
              label="File CSV"
              htmlFor="csv-file-upload"
              helperText="Header wajib: ref, payout_date, qty_produk, hpp, total_price, seller_discount, fee_admin, fee_service, fee_order_process, fee_program, fee_affiliate, shipping_cost, omset, payout_status."
            >
              <Input
                id="csv-file-upload"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setCsvFile(event.target.files?.[0] ?? null);
                  setCsvReview(null);
                }}
              />
            </FormField>
            {csvReview ? (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  Review: {csvReview.summary.validRows}/{csvReview.summary.totalRows} baris valid
                </p>
                <p className="text-muted-foreground">
                  Estimasi insert {csvReview.summary.insertedEstimate ?? 0}, update {csvReview.summary.updatedEstimate ?? 0}, error {csvReview.summary.errorCount}.
                </p>
                {csvReview.errors && csvReview.errors.length > 0 ? (
                  <div className="mt-2 max-h-44 overflow-auto rounded-md border border-border/60 bg-background p-2 text-xs">
                    {csvReview.errors.map((err, idx) => (
                      <p key={`${err.row}-${idx}`}>
                        Baris {err.row}{err.ref ? ` (${err.ref})` : ""}: {err.reason}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={uploadCsvModal.closeModal} disabled={isUploadingCsv}>
                Batal
              </Button>
              <Button variant="outline" disabled={!csvFile || isReviewingCsv || isUploadingCsv} onClick={handleReviewCsv}>
                {isReviewingCsv ? "Reviewing..." : "Review file"}
              </Button>
              <Button disabled={!csvFile || !csvReview?.ok || isUploadingCsv || isReviewingCsv} onClick={handleUploadCsv}>
                {isUploadingCsv ? "Uploading..." : "Upload CSV"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModalFormShell
        open={hooks.payoutModal.open}
        onOpenChange={hooks.payoutModal.setOpen}
        title={hooks.editingPayout ? "Ubah payout" : "Buat payout"}
        description="Kelola baris payout tanpa mengubah logika sales, warehouse, atau accounting."
        isSubmitting={hooks.payoutForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.payoutForm.handleSubmit((values: PayoutInput) => hooks.savePayout(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Referensi"
            htmlFor="payout_ref"
            helperText="Boleh isi manual dari data marketplace, atau pilih suggestion ref order yang sudah ada."
          >
            <Input id="payout_ref" list="payout-record-refs" {...hooks.payoutForm.register("ref")} />
          </FormField>
          <FormField
            label="Tanggal payout"
            htmlFor="payout_date"
            error={hooks.payoutForm.formState.errors.payout_date?.message}
          >
            <Input id="payout_date" type="date" {...hooks.payoutForm.register("payout_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <FormField
            label="Qty produk"
            htmlFor="qty_produk"
            error={hooks.payoutForm.formState.errors.qty_produk?.message}
          >
            <Input id="qty_produk" type="number" {...hooks.payoutForm.register("qty_produk", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Harga jual" htmlFor="total_price" error={hooks.payoutForm.formState.errors.total_price?.message}>
            <Input id="total_price" {...hooks.payoutForm.register("total_price")} />
          </FormField>
          <FormField
            label="Diskon seller"
            htmlFor="seller_discount"
            error={hooks.payoutForm.formState.errors.seller_discount?.message}
          >
            <Input id="seller_discount" {...hooks.payoutForm.register("seller_discount")} />
          </FormField>
          <FormField
            label="Harga setelah diskon"
            htmlFor="harga_setelah_diskon"
            helperText="Kalkulasi dari harga jual - diskon."
          >
            <Input
              id="harga_setelah_diskon"
              value={formatCalculatedValue(amountAfterDiscount)}
              readOnly
              className="bg-muted/40"
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <FormField label="Biaya admin" htmlFor="fee_admin" error={hooks.payoutForm.formState.errors.fee_admin?.message}>
            <Input id="fee_admin" {...hooks.payoutForm.register("fee_admin")} />
          </FormField>
          <FormField label="Biaya layanan" htmlFor="fee_service" error={hooks.payoutForm.formState.errors.fee_service?.message}>
            <Input id="fee_service" {...hooks.payoutForm.register("fee_service")} />
          </FormField>
          <FormField label="Biaya program" htmlFor="fee_program" error={hooks.payoutForm.formState.errors.fee_program?.message}>
            <Input id="fee_program" {...hooks.payoutForm.register("fee_program")} />
          </FormField>
          <FormField
            label="Biaya proses pesanan"
            htmlFor="fee_order_process"
            helperText="Sudah termasuk biaya transaksi lama bila ada histori data sebelumnya."
            error={hooks.payoutForm.formState.errors.fee_order_process?.message}
          >
            <Input id="fee_order_process" {...hooks.payoutForm.register("fee_order_process")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Biaya afiliasi"
            htmlFor="fee_affiliate"
            error={hooks.payoutForm.formState.errors.fee_affiliate?.message}
          >
            <Input id="fee_affiliate" {...hooks.payoutForm.register("fee_affiliate")} />
          </FormField>
          <FormField
            label="Biaya kirim"
            htmlFor="shipping_cost"
            error={hooks.payoutForm.formState.errors.shipping_cost?.message}
            helperText="Opsional bila datanya memang ikut dicatat di payout marketplace."
          >
            <Input id="shipping_cost" {...hooks.payoutForm.register("shipping_cost")} />
          </FormField>
          <FormField label="Payout bersih" htmlFor="omset" error={hooks.payoutForm.formState.errors.omset?.message}>
            <Input id="omset" {...hooks.payoutForm.register("omset")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="HPP"
            htmlFor="hpp"
            error={hooks.payoutForm.formState.errors.hpp?.message}
            helperText="Input manual. Tidak dihitung otomatis dari payout marketplace."
          >
            <Input id="hpp" {...hooks.payoutForm.register("hpp")} />
          </FormField>
          <FormField label="Margin" htmlFor="margin_kalkulasi" helperText="Kalkulasi dari payout bersih - HPP.">
            <Input
              id="margin_kalkulasi"
              value={formatCalculatedValue(marginAmount)}
              readOnly
              className="bg-muted/40"
            />
          </FormField>
          <FormField label="Status" htmlFor="payout_status" error={hooks.payoutForm.formState.errors.payout_status?.message}>
            <SelectNative
              id="payout_status"
              value={hooks.payoutForm.watch("payout_status") ?? ""}
              onChange={(event) =>
                hooks.payoutForm.setValue(
                  "payout_status",
                  event.target.value ? (event.target.value as (typeof PAYOUT_STATUS_OPTIONS)[number]) : null
                )
              }
            >
              {PAYOUT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}