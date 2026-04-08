CREATE TABLE IF NOT EXISTS payout.payout_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id integer NOT NULL,
  transfer_date date NOT NULL,
  amount numeric(18, 2) NOT NULL,
  bank_account_id uuid NOT NULL,
  notes text NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_payout_transfers_payout_id'
      AND conrelid = 'payout.payout_transfers'::regclass
  ) THEN
    ALTER TABLE payout.payout_transfers
    ADD CONSTRAINT fk_payout_transfers_payout_id
    FOREIGN KEY (payout_id)
    REFERENCES payout.t_payout(payout_id)
    ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_payout_transfers_bank_account_id'
      AND conrelid = 'payout.payout_transfers'::regclass
  ) THEN
    ALTER TABLE payout.payout_transfers
    ADD CONSTRAINT fk_payout_transfers_bank_account_id
    FOREIGN KEY (bank_account_id)
    REFERENCES accounting.accounts(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payout_transfers_payout_id
ON payout.payout_transfers (payout_id);

CREATE INDEX IF NOT EXISTS idx_payout_transfers_bank_account_id
ON payout.payout_transfers (bank_account_id);
