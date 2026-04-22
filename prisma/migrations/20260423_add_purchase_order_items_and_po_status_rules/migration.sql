CREATE TABLE IF NOT EXISTS "warehouse"."purchase_order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "po_id" UUID NOT NULL,
  "inv_code" VARCHAR(100) NOT NULL,
  "qty_ordered" INT NOT NULL,
  "unit_cost" DECIMAL(18,2),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "fk_purchase_order_items_po_id"
    FOREIGN KEY ("po_id") REFERENCES "warehouse"."purchase_orders"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_purchase_order_items_inv_code"
    FOREIGN KEY ("inv_code") REFERENCES "product"."master_inventory"("inv_code") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "idx_warehouse_purchase_order_items_po_id"
  ON "warehouse"."purchase_order_items"("po_id");
CREATE INDEX IF NOT EXISTS "idx_warehouse_purchase_order_items_inv_code"
  ON "warehouse"."purchase_order_items"("inv_code");
CREATE INDEX IF NOT EXISTS "idx_warehouse_purchase_order_items_po_inv"
  ON "warehouse"."purchase_order_items"("po_id", "inv_code");
