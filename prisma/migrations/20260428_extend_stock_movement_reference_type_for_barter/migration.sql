ALTER TABLE "warehouse"."stock_movements"
  DROP CONSTRAINT IF EXISTS "chk_stock_movements_reference_type";

ALTER TABLE "warehouse"."stock_movements"
  ADD CONSTRAINT "chk_stock_movements_reference_type"
  CHECK (
    "reference_type" IN (
      'INBOUND',
      'SALE',
      'ADJUSTMENT',
      'RETURN',
      'OPERATIONAL_EXPENSE_BARTER'
    )
  );
