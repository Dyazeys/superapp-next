ALTER TABLE "warehouse"."adjustments"
ADD COLUMN IF NOT EXISTS "post_status" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "posted_at" TIMESTAMPTZ(6);

UPDATE "warehouse"."adjustments" AS a
SET "post_status" = 'POSTED',
    "posted_at" = COALESCE(a."posted_at", now())
WHERE EXISTS (
  SELECT 1
  FROM "warehouse"."stock_movements" AS sm
  WHERE sm."reference_type" = 'ADJUSTMENT'
    AND sm."reference_id" = a."id"::text
);

UPDATE "warehouse"."adjustments"
SET "post_status" = 'DRAFT'
WHERE "post_status" IS NULL;

ALTER TABLE "warehouse"."adjustments"
ALTER COLUMN "post_status" SET DEFAULT 'DRAFT',
ALTER COLUMN "post_status" SET NOT NULL;
