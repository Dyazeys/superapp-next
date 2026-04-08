ALTER TABLE channel.m_channel
ADD COLUMN IF NOT EXISTS revenue_account_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_m_channel_revenue_account'
      AND conrelid = 'channel.m_channel'::regclass
  ) THEN
    ALTER TABLE channel.m_channel
    ADD CONSTRAINT fk_m_channel_revenue_account
    FOREIGN KEY (revenue_account_id)
    REFERENCES accounting.accounts(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_m_channel_revenue_account_id
ON channel.m_channel (revenue_account_id);
