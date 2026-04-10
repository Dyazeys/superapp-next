DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT COUNT(*)::int
  INTO duplicate_count
  FROM (
    SELECT 1
    FROM accounting.journal_entries
    WHERE reference_id IS NOT NULL
    GROUP BY reference_type, reference_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create unique reference key on accounting.journal_entries because % duplicate key(s) exist for (reference_type, reference_id).',
      duplicate_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_journal_entries_reference_type_reference_id
ON accounting.journal_entries (reference_type, reference_id)
WHERE reference_id IS NOT NULL;
