export const CANONICAL_PAYOUT_STATUSES = ["SETTLED", "FAILED"] as const;

export type CanonicalPayoutStatus = (typeof CANONICAL_PAYOUT_STATUSES)[number];

export function normalizePayoutStatus(value: string | null | undefined): CanonicalPayoutStatus | null {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "FAILED" || normalized === "CANCELLED") {
    return "FAILED";
  }

  return "SETTLED";
}

export function isFailedPayoutStatus(value: string | null | undefined) {
  return normalizePayoutStatus(value) === "FAILED";
}

export function isSettledPayoutStatus(value: string | null | undefined) {
  return !isFailedPayoutStatus(value);
}
