ALTER TABLE payout.t_payout
  ADD COLUMN IF NOT EXISTS post_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS idx_payout_t_payout_post_status
  ON payout.t_payout(post_status);
