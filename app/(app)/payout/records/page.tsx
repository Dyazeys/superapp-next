"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { formatMoney, formatShortDate } from "@/lib/format";
import { normalizePayoutStatus } from "@/lib/payout-status";
import {
  PAYOUT_STATUS_OPTIONS,
  payoutStatusTone,
  sumPayoutDeductions,
  sumPayoutFees,
  usePayoutAdjustments,
  usePayoutOrders,
  usePayoutSelection,
  usePayouts,
} from "@/features/payout/use-payout-module";
import type { PayoutInput } from "@/schemas/payout-module";
import type { PayoutAdjustmentRecord, PayoutRecord } from "@/types/payout";

const payoutColumnHelper = createColumnHelper<PayoutRecord>();
const adjustmentColumnHelper = createColumnHelper<PayoutAdjustmentRecord>();

type RecordPageFilter = {
  ref: string | null;
  channelId: number | null;
  payoutId: number | null;
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

export default function PayoutRecordsPage() {
  const hooks = usePayouts();
  const orderLookupQuery = usePayoutOrders();
  const [pageFilter] = useState<RecordPageFilter>(() => getRecordPageFilter());

  const payoutRows = useMemo(
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
  const { selectedPayoutId, currentPayoutId, setSelectedPayoutId } = usePayoutSelection(payoutRows);
  const totalPayouts = payoutRows.length;
  const settledCount = payoutRows.filter((row) => normalizePayoutStatus(row.payout_status) === "SETTLED").length;
  const totalGross = payoutRows.reduce((sum, row) => sum + Number(row.total_price), 0);
  const totalNet = payoutRows.reduce((sum, row) => sum + Number(row.omset), 0);

  const selectedPayout =
    payoutRows.find((payout) => payout.payout_id === currentPayoutId) ?? null;

  useEffect(() => {
    if (pageFilter.payoutId && payoutRows.some((payout) => payout.payout_id === pageFilter.payoutId)) {
      setSelectedPayoutId(pageFilter.payoutId);
      return;
    }

    if (pageFilter.ref) {
      const matchedPayout = payoutRows.find((payout) => payout.ref === pageFilter.ref);
      if (matchedPayout) {
        setSelectedPayoutId(matchedPayout.payout_id);
      }
    }
  }, [pageFilter.payoutId, pageFilter.ref, payoutRows, setSelectedPayoutId]);

  const detailAdjustments = usePayoutAdjustments(selectedPayout?.ref ?? undefined);

  const relatedAdjustmentTotal = (detailAdjustments.adjustmentsQuery.data ?? []).reduce(
    (sum, adjustment) => sum + Number(adjustment.amount),
    0
  );
  const grossAmount = toNumericInputValue(hooks.payoutForm.watch("total_price"));
  const sellerDiscount = toNumericInputValue(hooks.payoutForm.watch("seller_discount"));
  const amountAfterDiscount = Math.max(0, grossAmount - sellerDiscount);
  const netPayout = toNumericInputValue(hooks.payoutForm.watch("omset"));
  const hppAmount = toNumericInputValue(hooks.payoutForm.watch("hpp"));
  const marginAmount = netPayout - hppAmount;

  const payoutColumns = [
    payoutColumnHelper.accessor("ref", {
      header: "Referensi",
      cell: ({ row, getValue }) => (
        <div>
          <p className="font-medium">{getValue() ?? "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.t_order?.order_no ?? "Tanpa order"} / {row.original.t_order?.m_channel?.channel_name ?? "Tanpa channel"}
          </p>
        </div>
      ),
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
    payoutColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openPayoutModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deletePayout(row.original.payout_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const relatedAdjustmentColumns = [
    adjustmentColumnHelper.accessor("adjustment_date", {
      header: "Tanggal adjustment",
      cell: (info) => (info.getValue() ? formatShortDate(info.getValue() as string) : "-"),
    }),
    adjustmentColumnHelper.accessor("adjustment_type", {
      header: "Tipe",
      cell: (info) => info.getValue() ?? "-",
    }),
    adjustmentColumnHelper.accessor("reason", {
      header: "Alasan",
      cell: (info) => info.getValue() ?? "-",
    }),
    adjustmentColumnHelper.accessor("amount", {
      header: "Nominal",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
  ];

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
          <MetricCard title="Sudah settled" value={String(settledCount)} subtitle="Jumlah payout berstatus SETTLED." />
          <MetricCard title="Total bruto" value={formatMoney(totalGross)} subtitle="Akumulasi bruto dari data yang terlihat." />
          <MetricCard title="Total bersih" value={formatMoney(totalNet)} subtitle="Akumulasi payout bersih dari data yang terlihat." />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="w-full space-y-1.5 md:max-w-[620px]">
            <label htmlFor="payout-record-selection" className="text-xs font-medium tracking-[0.02em] text-foreground/80">
              Payout terpilih
            </label>
            <SelectNative
              id="payout-record-selection"
              className="w-full"
              value={selectedPayoutId ?? currentPayoutId ?? ""}
              onChange={(event) => setSelectedPayoutId(event.target.value ? Number(event.target.value) : null)}
            >
              {payoutRows.map((payout) => (
                <option key={payout.payout_id} value={payout.payout_id}>
                  {formatShortDate(payout.payout_date)} / {payout.ref ?? "Tanpa ref"} / {normalizePayoutStatus(payout.payout_status) ?? "Tidak diketahui"}
                </option>
              ))}
            </SelectNative>
            <p className="text-xs leading-5 text-muted-foreground">
              {selectedPayout
                ? `${selectedPayout.t_order?.order_no ?? "Tanpa order"} / bruto ${formatMoney(Number(selectedPayout.total_price))} / bersih ${formatMoney(Number(selectedPayout.omset))}`
                : "Pilih payout untuk melihat relasi order dan adjustment terkait."}
            </p>
          </div>
          <Button size="sm" onClick={() => hooks.openPayoutModal()}>
            <Plus className="size-4" />
            Tambah payout
          </Button>
        </div>

        {selectedPayout ? (
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Relasi order</p>
              <p className="mt-3 text-lg font-semibold">{selectedPayout.ref ?? "-"}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPayout.t_order?.order_no ?? "Tanpa order"} / {selectedPayout.t_order?.m_channel?.channel_name ?? "Tanpa channel"}
              </p>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bruto / bersih</p>
              <p className="mt-3 text-lg font-semibold">{formatMoney(Number(selectedPayout.total_price))}</p>
              <p className="text-sm text-muted-foreground">Payout bersih {formatMoney(Number(selectedPayout.omset))}</p>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Potongan / biaya</p>
              <p className="mt-3 text-lg font-semibold">{formatMoney(sumPayoutDeductions(selectedPayout))}</p>
              <p className="text-sm text-muted-foreground">
                Biaya {formatMoney(sumPayoutFees(selectedPayout))} / ongkir {formatMoney(Number(selectedPayout.shipping_cost))}
              </p>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status / tanggal</p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge
                  label={normalizePayoutStatus(selectedPayout.payout_status) ?? "Tidak diketahui"}
                  tone={payoutStatusTone(selectedPayout.payout_status)}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatShortDate(selectedPayout.payout_date)}</p>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Belum ada payout terpilih"
            description="Pilih atau buat payout untuk melihat detail payout yang terhubung."
          />
        )}

        <DataTable columns={payoutColumns} data={payoutRows} emptyMessage="Belum ada data payout." />

        {selectedPayout?.ref ? (
          <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Adjustment terkait</h2>
              <p className="text-sm text-muted-foreground">
                {selectedPayout.ref} / {detailAdjustments.adjustmentsQuery.data?.length ?? 0} baris / total {formatMoney(relatedAdjustmentTotal)}
              </p>
            </div>
            <DataTable
              columns={relatedAdjustmentColumns}
              data={detailAdjustments.adjustmentsQuery.data ?? []}
              emptyMessage="Belum ada adjustment payout untuk referensi ini."
            />
          </div>
        ) : null}
      </div>

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
          <FormField label="Harga setelah diskon" htmlFor="harga_setelah_diskon" helperText="Kalkulasi dari harga jual - diskon.">
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
