import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { AppError, jsonError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";
import { normalizePayoutStatus } from "@/lib/payout-status";
import { syncSalesStatusFromPayout } from "@/lib/sales-payout-sync";

type CsvRow = Record<string, string>;
type ValidationIssue = { row: number; ref?: string; reason: string };
const LOOKUP_CHUNK_SIZE = 300;

const REQUIRED_HEADERS = [
  "ref",
  "payout_date",
  "qty_produk",
  "hpp",
  "total_price",
  "seller_discount",
  "fee_admin",
  "fee_service",
  "fee_order_process",
  "fee_program",
  "fee_affiliate",
  "shipping_cost",
  "omset",
  "payout_status",
] as const;

function parseLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [] as string[], rows: [] as CsvRow[] };
  const headers = parseLine(lines[0]);
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseLine(lines[i]);
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j += 1) row[headers[j]] = cols[j] ?? "";
    rows.push(row);
  }
  return { headers, rows };
}

function asMoney(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === ".") return 0;
  const normalized = raw
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") return 0;
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? Math.abs(num) : 0;
}

function asInt(value: string) {
  const n = Number.parseInt(String(value ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function asDateOnly(value: string) {
  const raw = String(value ?? "").trim();
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.PAYOUT_RECORD_CREATE);
    const reviewOnly = request.nextUrl.searchParams.get("review") === "1";

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File CSV wajib diisi." }, { status: 400 });
    }

    const parsed = parseCsv(await file.text());
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !parsed.headers.includes(h));
    if (missingHeaders.length) {
      return NextResponse.json(
        { error: `Header wajib belum lengkap: ${missingHeaders.join(", ")}` },
        { status: 400 }
      );
    }

    const issues: ValidationIssue[] = [];
    const seenRefs = new Set<string>();
    const candidateRows: Array<{ rowNum: number; row: CsvRow; ref: string; payoutDate: Date }> = [];

    for (let i = 0; i < parsed.rows.length; i += 1) {
      const row = parsed.rows[i];
      const rowNum = i + 2;
      const ref = String(row.ref ?? "").trim();
      const payoutDate = asDateOnly(row.payout_date);

      if (!ref) {
        issues.push({ row: rowNum, reason: "ref kosong" });
        continue;
      }
      if (seenRefs.has(ref)) {
        issues.push({ row: rowNum, ref, reason: "ref duplikat di file CSV" });
        continue;
      }
      if (!payoutDate) {
        issues.push({ row: rowNum, ref, reason: `payout_date tidak valid (${row.payout_date ?? ""})` });
        continue;
      }

      seenRefs.add(ref);
      candidateRows.push({ rowNum, row, ref, payoutDate });
    }

    const refList = candidateRows.map((item) => item.ref);
    let existingOrders: Array<{ ref_no: string | null }> = [];
    try {
      for (const chunk of chunkArray(refList, LOOKUP_CHUNK_SIZE)) {
        const rows = await prisma.t_order.findMany({
          where: { ref_no: { in: chunk } },
          select: { ref_no: true },
        });
        existingOrders = existingOrders.concat(rows);
      }
    } catch {
      throw new AppError(
        "Review gagal memeriksa referensi order. Coba upload file lebih kecil (mis. per 300-500 baris) lalu ulangi.",
        400
      );
    }
    const validRefSet = new Set(existingOrders.map((item) => item.ref_no).filter(Boolean) as string[]);
    for (const item of candidateRows) {
      if (!validRefSet.has(item.ref)) {
        issues.push({ row: item.rowNum, ref: item.ref, reason: "ref tidak ditemukan di sales.t_order" });
      }
    }

    const rowsReady = candidateRows.filter((item) => validRefSet.has(item.ref));
    let existingPayouts: Array<{ ref: string | null; post_status: string }> = [];
    try {
      const payoutRefs = rowsReady.map((item) => item.ref);
      for (const chunk of chunkArray(payoutRefs, LOOKUP_CHUNK_SIZE)) {
        const rows = await prisma.t_payout.findMany({
          where: { ref: { in: chunk } },
          select: { ref: true, post_status: true },
        });
        existingPayouts = existingPayouts.concat(rows);
      }
    } catch {
      throw new AppError(
        "Review gagal memeriksa data payout lama. Coba ulang beberapa saat lagi, atau upload file dalam beberapa batch kecil.",
        400
      );
    }
    const existingPayoutSet = new Set(existingPayouts.map((item) => item.ref).filter(Boolean) as string[]);
    const payoutStatusByRef = new Map(
      existingPayouts.filter((item) => item.ref).map((item) => [item.ref as string, item.post_status ?? "DRAFT"])
    );

    for (const item of rowsReady) {
      const currentPostStatus = payoutStatusByRef.get(item.ref);
      if (currentPostStatus && currentPostStatus !== "DRAFT") {
        issues.push({
          row: item.rowNum,
          ref: item.ref,
          reason: `payout sudah ${currentPostStatus}, tidak bisa dioverwrite dari import`,
        });
      }
    }

    const rowsExecutable = rowsReady.filter((item) => (payoutStatusByRef.get(item.ref) ?? "DRAFT") === "DRAFT");

    const summary = {
      totalRows: parsed.rows.length,
      validRows: rowsExecutable.length,
      insertedEstimate: rowsExecutable.filter((item) => !existingPayoutSet.has(item.ref)).length,
      updatedEstimate: rowsExecutable.filter((item) => existingPayoutSet.has(item.ref)).length,
      errorCount: issues.length,
    };

    if (reviewOnly) {
      return NextResponse.json({
        ok: issues.length === 0,
        reviewOnly: true,
        summary,
        errors: issues.slice(0, 100),
      });
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          error: "File belum valid. Jalankan review dulu dan perbaiki error sebelum upload.",
          summary,
          errors: issues.slice(0, 100),
        },
        { status: 400 }
      );
    }

    let inserted = 0;
    let updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const item of rowsExecutable) {
        const existing = await tx.t_payout.findFirst({
          where: { ref: item.ref },
          select: { payout_id: true, post_status: true },
        });
        if (existing && existing.post_status !== "DRAFT") {
          continue;
        }

        const payload = {
          ref: item.ref,
          payout_date: item.payoutDate,
          qty_produk: asInt(item.row.qty_produk),
          hpp: asMoney(item.row.hpp),
          total_price: asMoney(item.row.total_price),
          seller_discount: asMoney(item.row.seller_discount),
          fee_admin: asMoney(item.row.fee_admin),
          fee_service: asMoney(item.row.fee_service),
          fee_order_process: asMoney(item.row.fee_order_process),
          fee_program: asMoney(item.row.fee_program),
          fee_affiliate: asMoney(item.row.fee_affiliate),
          shipping_cost: asMoney(item.row.shipping_cost),
          omset: asMoney(item.row.omset),
          payout_status: normalizePayoutStatus(item.row.payout_status) ?? "SETTLED",
          post_status: "DRAFT",
          posted_at: null,
          locked_at: null,
          voided_at: null,
        };

        const result = existing
          ? await tx.t_payout.update({
              where: { payout_id: existing.payout_id },
              data: payload,
              select: { payout_id: true, ref: true, payout_status: true },
            })
          : await tx.t_payout.create({
              data: payload,
              select: { payout_id: true, ref: true, payout_status: true },
            });

        if (existing) updated += 1;
        else inserted += 1;

        await syncSalesStatusFromPayout(tx, result.ref, result.payout_status);
      }
    });

    return NextResponse.json({
      ok: true,
      reviewOnly: false,
      summary: {
        totalRows: parsed.rows.length,
        validRows: rowsExecutable.length,
        inserted,
        updated,
        errorCount: 0,
      },
    });
  } catch (error) {
    return jsonError(error, "Failed to import payout CSV.");
  }
}
