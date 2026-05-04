-- Rebuild tiktok_traffic: drop old + create new with additional columns
DROP TABLE IF EXISTS marketing.tiktok_traffic CASCADE;

CREATE TABLE marketing.tiktok_traffic (
  id                             UUID        NOT NULL DEFAULT gen_random_uuid(),
  date                           DATE        NOT NULL,
  gross_merchandise_value        DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  refund_amount                  DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  gross_revenue_platform_subsidy DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  products_sold                  INT         NOT NULL DEFAULT 0,
  buyers                         INT         NOT NULL DEFAULT 0,
  page_views                     INT         NOT NULL DEFAULT 0,
  store_visits                   INT         NOT NULL DEFAULT 0,
  sku_orders                     INT         NOT NULL DEFAULT 0,
  orders                         INT         NOT NULL DEFAULT 0,
  conversion_rate                DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  product_impressions            INT         NOT NULL DEFAULT 0,
  unique_product_impressions     INT         NOT NULL DEFAULT 0,
  product_clicks                 INT         NOT NULL DEFAULT 0,
  unique_clicks                  INT         NOT NULL DEFAULT 0,
  aov                            DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  created_at                     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ(6),

  CONSTRAINT tiktok_traffic_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tiktok_traffic_date ON marketing.tiktok_traffic(date);
