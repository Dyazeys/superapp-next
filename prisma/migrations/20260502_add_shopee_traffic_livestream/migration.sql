-- Create shopee_traffic table for Shopee store traffic data
CREATE TABLE marketing.shopee_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    region VARCHAR(50) NOT NULL,
    gross_sales_usd DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_sales_local DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_sales_rebate_usd DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_sales_rebate_local DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_orders INT NOT NULL DEFAULT 0,
    gross_units_sold INT NOT NULL DEFAULT 0,
    gross_avg_basket_usd DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_avg_basket_local DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_item_per_order DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    gross_avg_selling_price_usd DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_avg_selling_price_local DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    product_views INT NOT NULL DEFAULT 0,
    product_clicks INT NOT NULL DEFAULT 0,
    unique_visitors INT NOT NULL DEFAULT 0,
    gross_order_conversion_rate DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    gross_item_conversion_rate DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shopee_traffic_date ON marketing.shopee_traffic(date);

-- Create shopee_livestream table for Shopee livestream session data
CREATE TABLE marketing.shopee_livestream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    sesi VARCHAR(50) NOT NULL,
    pengunjung INT NOT NULL DEFAULT 0,
    penonton_terbanyak INT NOT NULL DEFAULT 0,
    rata_durasi_menonton VARCHAR(8) NOT NULL, -- format HH:MM:SS
    pesanan INT NOT NULL DEFAULT 0,
    penjualan DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shopee_livestream_date ON marketing.shopee_livestream(date);