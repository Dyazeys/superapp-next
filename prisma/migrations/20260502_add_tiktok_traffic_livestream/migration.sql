-- Create tiktok_traffic table for TikTok store traffic data
CREATE TABLE marketing.tiktok_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    gross_merchandise_value DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    refund_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    gross_revenue_platform_subsidy DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    products_sold INT NOT NULL DEFAULT 0,
    buyers INT NOT NULL DEFAULT 0,
    page_views INT NOT NULL DEFAULT 0,
    store_visits INT NOT NULL DEFAULT 0,
    sku_orders INT NOT NULL DEFAULT 0,
    orders INT NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tiktok_traffic_date ON marketing.tiktok_traffic(date);

-- Create tiktok_livestream table for TikTok livestream session data
CREATE TABLE marketing.tiktok_livestream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    sesi VARCHAR(50) NOT NULL,
    impressions INT NOT NULL DEFAULT 0,
    views INT NOT NULL DEFAULT 0,
    product_clicks INT NOT NULL DEFAULT 0,
    pesanan INT NOT NULL DEFAULT 0,
    penjualan DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tiktok_livestream_date ON marketing.tiktok_livestream(date);