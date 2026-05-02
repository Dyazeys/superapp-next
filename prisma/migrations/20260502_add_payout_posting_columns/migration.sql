-- Add posting lifecycle columns to payout.t_payout
-- These columns exist in prisma/schema.prisma but were missing from production DB

ALTER TABLE payout.t_payout
  ADD COLUMN IF NOT EXISTS post_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS posted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_at   TIMESTAMPTZ;

-- Add index for post_status (matches schema.prisma @@index)
CREATE INDEX IF NOT EXISTS idx_payout_t_payout_post_status ON payout.t_payout(post_status);