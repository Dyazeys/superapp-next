CREATE TABLE "accounting"."operational_expense_barter" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "barter_date" DATE NOT NULL,
  "expense_account_id" UUID NOT NULL,
  "expense_label" VARCHAR(100),
  "description" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "total_amount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  "reference_no" VARCHAR(100),
  "notes_internal" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6),
  "posted_at" TIMESTAMPTZ(6),
  "voided_at" TIMESTAMPTZ(6),
  CONSTRAINT "operational_expense_barter_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_operational_expense_barter_expense_account_id"
    FOREIGN KEY ("expense_account_id") REFERENCES "accounting"."accounts"("id") ON DELETE RESTRICT
);

CREATE TABLE "accounting"."operational_expense_barter_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "barter_id" UUID NOT NULL,
  "inv_code" VARCHAR(100) NOT NULL,
  "qty" INTEGER NOT NULL,
  "unit_amount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  "line_amount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "operational_expense_barter_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_operational_expense_barter_items_barter_id"
    FOREIGN KEY ("barter_id") REFERENCES "accounting"."operational_expense_barter"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_operational_expense_barter_items_inv_code"
    FOREIGN KEY ("inv_code") REFERENCES "product"."master_inventory"("inv_code") ON DELETE RESTRICT
);

CREATE INDEX "idx_accounting_operational_expense_barter_date"
  ON "accounting"."operational_expense_barter"("barter_date");

CREATE INDEX "idx_accounting_operational_expense_barter_expense_account_id"
  ON "accounting"."operational_expense_barter"("expense_account_id");

CREATE INDEX "idx_accounting_operational_expense_barter_status"
  ON "accounting"."operational_expense_barter"("status");

CREATE INDEX "idx_accounting_operational_expense_barter_items_barter_id"
  ON "accounting"."operational_expense_barter_items"("barter_id");

CREATE INDEX "idx_accounting_operational_expense_barter_items_inv_code"
  ON "accounting"."operational_expense_barter_items"("inv_code");
