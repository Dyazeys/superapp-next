ALTER TABLE accounting.operational_expenses
ADD COLUMN IF NOT EXISTS expense_label VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_accounting_operational_expenses_expense_label
ON accounting.operational_expenses (expense_label);
