import type { ApprovalType, ApprovalStatus } from "@/types/task";

export const TYPE_LABELS: Record<ApprovalType, string> = {
  leave: "Izin",
  announcement: "Pengumuman",
  meeting_note: "Notulen",
  opex: "Opex",
  opex_barter: "Opex Barter",
  sales_order: "Sales Order",
  inbound: "Inbound",
  warehouse_adjustment: "Adjustment Gudang",
};

export const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  leader_approved: "bg-blue-100 text-blue-700",
  manager_acknowledged: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  leader_approved: "Disetujui Leader",
  manager_acknowledged: "Selesai",
  rejected: "Ditolak",
};

export const LEADER_APPROVAL_TYPES: ApprovalType[] = [
  "sales_order",
  "inbound",
  "warehouse_adjustment",
];

export const MANAGER_APPROVAL_TYPES: ApprovalType[] = [
  "opex",
  "opex_barter",
];

export type DomainDetailField = { label: string; value: string | number | null };
export type DomainDetailSection = { title: string; fields: DomainDetailField[] };

export function buildOpexDetail(d: Record<string, unknown>): DomainDetailSection[] {
  return [
    {
      title: "Detail Opex",
      fields: [
        { label: "Label", value: (d.expense_label as string) ?? null },
        { label: "Jumlah", value: typeof d.amount === "number" ? `Rp ${Number(d.amount).toLocaleString("id-ID")}` : null },
        { label: "Tanggal", value: d.expense_date ? new Date(d.expense_date as string).toLocaleDateString("id-ID") : null },
        { label: "Akun Bayar", value: (d.payment_account as string) ?? null },
        { label: "Akun Expense", value: (d.expense_account as string) ?? null },
        { label: "Deskripsi", value: (d.description as string) ?? null },
        { label: "Status", value: (d.status as string) ?? null },
      ],
    },
  ];
}

export function buildOpexBarterDetail(d: Record<string, unknown>): DomainDetailSection[] {
  const items = Array.isArray(d.items) ? d.items as Array<Record<string, unknown>> : [];
  return [
    {
      title: "Detail Opex Barter",
      fields: [
        { label: "Label", value: (d.expense_label as string) ?? null },
        { label: "Total", value: typeof d.total_amount === "number" ? `Rp ${Number(d.total_amount).toLocaleString("id-ID")}` : null },
        { label: "Tanggal", value: d.barter_date ? new Date(d.barter_date as string).toLocaleDateString("id-ID") : null },
        { label: "No. Referensi", value: (d.reference_no as string) ?? null },
        { label: "Deskripsi", value: (d.description as string) ?? null },
        { label: "Status", value: (d.status as string) ?? null },
      ],
    },
    ...(items.length > 0 ? [{
      title: `Items (${items.length})`,
      fields: items.flatMap((item, i) => [
        { label: `${i + 1}. Inv Code`, value: (item.inv_code as string) ?? null },
        { label: `   Qty`, value: typeof item.qty === "number" ? item.qty : null },
        { label: `   Unit Amount`, value: typeof item.unit_amount === "number" ? `Rp ${Number(item.unit_amount).toLocaleString("id-ID")}` : null },
        { label: `   Line Amount`, value: typeof item.line_amount === "number" ? `Rp ${Number(item.line_amount).toLocaleString("id-ID")}` : null },
      ]),
    }] : []),
  ];
}

export function buildSalesOrderDetail(d: Record<string, unknown>): DomainDetailSection[] {
  return [
    {
      title: "Detail Sales Order",
      fields: [
        { label: "No. Order", value: (d.order_no as string) ?? null },
        { label: "Tanggal", value: d.order_date ? new Date(d.order_date as string).toLocaleDateString("id-ID") : null },
        { label: "No. Ref", value: (d.ref_no as string) ?? null },
        { label: "Customer", value: (d.customer_name as string) ?? null },
        { label: "Channel", value: (d.channel_name as string) ?? null },
        { label: "Total", value: typeof d.total_amount === "number" ? `Rp ${Number(d.total_amount).toLocaleString("id-ID")}` : null },
        { label: "Jumlah Item", value: typeof d.item_count === "number" ? `${d.item_count} item` : null },
        { label: "Status", value: (d.status as string) ?? null },
        { label: "Historical", value: d.is_historical ? "Ya" : "Tidak" },
      ],
    },
  ];
}

export function buildInboundDetail(d: Record<string, unknown>): DomainDetailSection[] {
  return [
    {
      title: "Detail Inbound",
      fields: [
        { label: "Tanggal Terima", value: d.receive_date ? new Date(d.receive_date as string).toLocaleDateString("id-ID") : null },
        { label: "Surat Jalan Vendor", value: (d.surat_jalan_vendor as string) ?? null },
        { label: "QC Status", value: (d.qc_status as string) ?? null },
        { label: "Diterima Oleh", value: (d.received_by as string) ?? null },
        { label: "No. PO", value: (d.po_no as string) ?? null },
        { label: "Vendor", value: (d.vendor_name as string) ?? null },
        { label: "Total Diterima", value: typeof d.total_received === "number" ? d.total_received : null },
        { label: "Total Passed QC", value: typeof d.total_passed === "number" ? d.total_passed : null },
        { label: "Total Rejected", value: typeof d.total_rejected === "number" ? d.total_rejected : null },
        { label: "Jumlah Item", value: typeof d.item_count === "number" ? `${d.item_count} item` : null },
        { label: "Notes", value: (d.notes as string) ?? null },
      ],
    },
  ];
}

export function buildWarehouseAdjustmentDetail(d: Record<string, unknown>): DomainDetailSection[] {
  return [
    {
      title: "Detail Adjustment",
      fields: [
        { label: "Tanggal", value: d.adjustment_date ? new Date(d.adjustment_date as string).toLocaleDateString("id-ID") : null },
        { label: "Inv Code", value: (d.inv_code as string) ?? null },
        { label: "Nama Produk", value: (d.product_name as string) ?? null },
        { label: "Tipe", value: (d.adj_type as string) ?? null },
        { label: "Qty", value: typeof d.qty === "number" ? d.qty : null },
        { label: "Alasan", value: (d.reason as string) ?? null },
        { label: "Notes", value: (d.notes as string) ?? null },
        { label: "Post Status", value: (d.post_status as string) ?? null },
      ],
    },
  ];
}

export function buildDomainDetail(type: ApprovalType, domainDetail: Record<string, unknown>): DomainDetailSection[] {
  switch (type) {
    case "opex": return buildOpexDetail(domainDetail);
    case "opex_barter": return buildOpexBarterDetail(domainDetail);
    case "sales_order": return buildSalesOrderDetail(domainDetail);
    case "inbound": return buildInboundDetail(domainDetail);
    case "warehouse_adjustment": return buildWarehouseAdjustmentDetail(domainDetail);
    default: return [];
  }
}
