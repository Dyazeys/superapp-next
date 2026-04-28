UPDATE payout.t_payout
SET fee_order_process = COALESCE(fee_order_process, 0) + COALESCE(fee_transaction, 0),
    fee_transaction = 0
WHERE COALESCE(fee_transaction, 0) <> 0;

ALTER TABLE payout.t_payout
DROP COLUMN IF EXISTS fee_transaction;
