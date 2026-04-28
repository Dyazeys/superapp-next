ALTER TABLE accounting.operational_expenses
ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS posted_at timestamptz(6),
ADD COLUMN IF NOT EXISTS voided_at timestamptz(6);

UPDATE accounting.operational_expenses
SET
  status = 'POSTED',
  posted_at = COALESCE(posted_at, updated_at, created_at),
  voided_at = NULL
WHERE status = 'DRAFT';

CREATE INDEX IF NOT EXISTS idx_accounting_operational_expenses_status
ON accounting.operational_expenses(status);
