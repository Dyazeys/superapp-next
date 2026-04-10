import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { getPayoutReconciliationReport } from "@/lib/payout-reconciliation";

export async function GET() {
  try {
    const report = await getPayoutReconciliationReport();
    return NextResponse.json(report);
  } catch (error) {
    return jsonError(error, "Failed to load payout reconciliation.");
  }
}
