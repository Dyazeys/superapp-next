import { NextRequest, NextResponse } from "next/server";
import { invariant, jsonError } from "@/lib/api-error";
import { getPayoutReconciliationReport } from "@/lib/payout-reconciliation";
import type { PayoutReconciliationFilter, PayoutReconciliationPeriodPreset } from "@/types/payout";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveReconciliationFilter(request: NextRequest): PayoutReconciliationFilter {
  const period = (request.nextUrl.searchParams.get("period") ?? "all") as PayoutReconciliationPeriodPreset;
  invariant(["all", "this_month", "custom"].includes(period), "Invalid period filter.");

  if (period === "all") {
    return { period };
  }

  if (period === "this_month") {
    const now = new Date();
    const fromDate = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
    const toDate = toDateInputValue(now);
    return { period, fromDate, toDate };
  }

  const fromDate = request.nextUrl.searchParams.get("fromDate") ?? "";
  const toDate = request.nextUrl.searchParams.get("toDate") ?? "";

  invariant(DATE_ONLY_PATTERN.test(fromDate), "Invalid fromDate. Expected YYYY-MM-DD.");
  invariant(DATE_ONLY_PATTERN.test(toDate), "Invalid toDate. Expected YYYY-MM-DD.");
  invariant(fromDate <= toDate, "Invalid date range. fromDate must be before or equal to toDate.");

  return { period, fromDate, toDate };
}

export async function GET(request: NextRequest) {
  try {
    const filter = resolveReconciliationFilter(request);
    const report = await getPayoutReconciliationReport(filter);
    return NextResponse.json(report);
  } catch (error) {
    return jsonError(error, "Failed to load payout reconciliation.");
  }
}
