"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Lock, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, formatShortDate } from "@/lib/format";
import {
  PAYOUT_ADJUSTMENT_TYPE_OPTIONS,
  usePayoutAdjustments,
  usePayoutChannels,
  usePayoutOrders,
} from "@/features/payout/use-payout-module";
import type { PayoutAdjustmentInput } from "@/schemas/payout-module";
import type { PayoutAdjustmentRecord } from "@/types/payout";

const columnHelper = createColumnHelper<PayoutAdjustmentRecord>();

type AdjustmentPageFilter = {
  ref: string | null;
  channelId: number | null;
};

function getAdjustmentPageFilter(): AdjustmentPageFilter {
  if (typeof window === "undefined") {
    return { ref: null, channelId: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const channelId = Number(searchParams.get("channel_id") ?? "");

  return {
    ref: searchParams.get("ref") || null,
    channelId: Number.isFinite(channelId) && channelId > 0 ? channelId : null,
  };
}

export default function PayoutAdjustmentsPage() {
  const hooks = usePayoutAdjustments();
  const orderLookupQuery = usePayoutOrders();
  const channelsQuery = usePayoutChannels();
  const [pageFilter] = useState<AdjustmentPageFilter>(() => getAdjustmentPageFilter());

  const adjustmentRows = useMemo(
    () =>
      (hooks.adjustmentsQuery.data ?? []).filter((row) => {
        if (pageFilter.ref && row.ref !== pageFilter.ref) {
          return false;
        }

        if (
          pageFilter.channelId &&
          (row.channel_id ?? row.m_channel?.channel_id ?? row.t_order?.m_channel?.channel_id ?? null) !== pageFilter.channelId
        ) {
          return false;
        }

        return true;
      }),
    [hooks.adjustmentsQuery.data, pageFilter.channelId, pageFilter.ref]
  );
  const totalAdjustments = adjustmentRows.length;
  const totalAmount = adjustmentRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const uniqueRefs = new Set(adjustmentRows.map((row) => row.ref ?? "")).size - (adjustmentRows.some((row) => !row.ref) ? 1 : 0);
  const latestDate =
    adjustmentRows.length === 0
      ? "-"
      : adjustmentRows
          .map((row) => (row.adjustment_date ? String(row.adjustment_date) : ""))
          .filter(Boolean)
          .reduce((latest, next) => (next > latest ? next : latest), "")
          .slice(0, 10);

  const columns = [
    columnHelper.accessor("ref", {
      header: "Referensi",
      cell: ({ row, getValue }) => (
        <div>
          <p className="font-medium">{getValue() ?? "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.t_order?.order_no ?? "Tanpa order"} / {row.original.m_channel?.channel_name ?? row.original.t_order?.m_channel?.channel_name ?? "Tanpa channel"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("payout_date", {
      header: "Tanggal payout",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    columnHelper.accessor("adjustment_date", {
      header: "Tanggal adjustment",
      cell: (info) => (info.getValue() ? formatShortDate(info.getValue() as string) : "-"),
    }),
    columnHelper.accessor("adjustment_type", {
      header: "Tipe",
      cell: (info) => <StatusBadge label={info.getValue() ?? "-"} tone="info" />,
    }),
    columnHelper.accessor("reason", {
      header: "Alasan",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("amount", {
      header: "Nominal",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("post_status", {
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
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {(row.original.post_status ?? "DRAFT") === "DRAFT" ? (
            <Button size="icon-xs" variant="outline" onClick={() => hooks.openAdjustmentModal(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
          ) : null}
          {(row.original.post_status ?? "DRAFT") === "DRAFT" ? (
            <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteAdjustment(row.original.adjustment_id)}>
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
          {(row.original.post_status ?? "DRAFT") === "DRAFT" ? (
            <Button size="sm" variant="outline" onClick={() => void hooks.changeAdjustmentLifecycle(row.original.adjustment_id, "POST")}>
              Post
            </Button>
          ) : null}
          {(row.original.post_status ?? "DRAFT") === "POSTED" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => void hooks.changeAdjustmentLifecycle(row.original.adjustment_id, "LOCK")}>
                <Lock className="size-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => void hooks.changeAdjustmentLifecycle(row.original.adjustment_id, "VOID")}>
                <RotateCcw className="size-3.5" />
              </Button>
            </>
          ) : null}
          {(row.original.post_status ?? "DRAFT") === "LOCKED" ? (
            <Button size="sm" variant="outline" onClick={() => void hooks.changeAdjustmentLifecycle(row.original.adjustment_id, "VOID")}>
              <RotateCcw className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Payout"
      title="Adjustment Payout"
      description="Kelola adjustment payout untuk koreksi nilai payout. Setiap adjustment baru akan mem-posting jurnal adjustment payout secara otomatis."
    >
      <div className="space-y-5">
        <datalist id="payout-adjustment-refs">
          {(orderLookupQuery.data ?? []).map((order) =>
            order.ref_no ? (
              <option key={order.order_no} value={order.ref_no}>
                {order.order_no} / {order.m_channel?.channel_name ?? "Tanpa channel"}
              </option>
            ) : null
          )}
        </datalist>
        {pageFilter.ref || pageFilter.channelId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Menampilkan adjustment dengan filter
              {pageFilter.ref ? ` ref ${pageFilter.ref}` : ""}
              {pageFilter.ref && pageFilter.channelId ? " dan" : ""}
              {pageFilter.channelId ? ` channel #${pageFilter.channelId}` : ""}.
            </p>
            <Link
              href="/payout/adjustments"
              className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              Lihat semua adjustment
            </Link>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total adjustment" value={String(totalAdjustments)} subtitle="Jumlah adjustment yang terlihat." />
          <MetricCard title="Total nominal" value={formatMoney(totalAmount)} subtitle="Akumulasi nominal dari data yang terlihat." />
          <MetricCard title="Ref unik" value={String(Math.max(uniqueRefs, 0))} subtitle="Jumlah referensi unik yang tampil." />
          <MetricCard title="Tanggal terbaru" value={latestDate} subtitle="Tanggal adjustment terbaru." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openAdjustmentModal()}>
            <Plus className="size-4" />
            Tambah adjustment
          </Button>
        </div>
        <DataTable columns={columns} data={adjustmentRows} emptyMessage="Belum ada adjustment payout." />
      </div>

      <ModalFormShell
        open={hooks.adjustmentModal.open}
        onOpenChange={hooks.adjustmentModal.setOpen}
        title={hooks.editingAdjustment ? "Ubah adjustment payout" : "Buat adjustment payout"}
        description="Adjustment akan sinkron ke jurnal payout adjustment saat di-POST."
        isSubmitting={hooks.adjustmentForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.adjustmentForm.handleSubmit((values: PayoutAdjustmentInput) => hooks.saveAdjustment(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Referensi"
            htmlFor="adjustment_ref"
            helperText="Boleh isi manual dari data marketplace, atau pilih suggestion ref order yang sudah ada."
          >
            <Input id="adjustment_ref" list="payout-adjustment-refs" {...hooks.adjustmentForm.register("ref")} />
          </FormField>
          <FormField
            label="Tanggal payout"
            htmlFor="adjustment_payout_date"
            error={hooks.adjustmentForm.formState.errors.payout_date?.message}
          >
            <Input id="adjustment_payout_date" type="date" {...hooks.adjustmentForm.register("payout_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Tanggal adjustment"
            htmlFor="adjustment_date"
            error={hooks.adjustmentForm.formState.errors.adjustment_date?.message}
          >
            <Input id="adjustment_date" type="date" {...hooks.adjustmentForm.register("adjustment_date")} />
          </FormField>
          <FormField
            label="Channel"
            htmlFor="adjustment_channel_id"
            error={hooks.adjustmentForm.formState.errors.channel_id?.message}
            helperText={
              (channelsQuery.data?.length ?? 0) === 0
                ? "Belum ada master channel. Lengkapi dulu di menu Channel."
                : undefined
            }
          >
            <SelectNative
              id="adjustment_channel_id"
              value={String(hooks.adjustmentForm.watch("channel_id") ?? "")}
              onChange={(event) =>
                hooks.adjustmentForm.setValue("channel_id", event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Tanpa channel</option>
              {(channelsQuery.data ?? []).map((channel) => (
                <option key={channel.channel_id} value={channel.channel_id}>
                  {channel.channel_name}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Tipe" htmlFor="adjustment_type">
            <SelectNative
              id="adjustment_type"
              value={hooks.adjustmentForm.watch("adjustment_type") ?? ""}
              onChange={(event) =>
                hooks.adjustmentForm.setValue(
                  "adjustment_type",
                  event.target.value
                    ? (event.target.value as (typeof PAYOUT_ADJUSTMENT_TYPE_OPTIONS)[number])
                    : null
                )
              }
            >
              <option value="">Tanpa tipe</option>
              {PAYOUT_ADJUSTMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Nominal" htmlFor="adjustment_amount" error={hooks.adjustmentForm.formState.errors.amount?.message}>
            <Input id="adjustment_amount" {...hooks.adjustmentForm.register("amount")} />
          </FormField>
        </div>
        <FormField label="Alasan" htmlFor="adjustment_reason">
          <Textarea id="adjustment_reason" {...hooks.adjustmentForm.register("reason")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
