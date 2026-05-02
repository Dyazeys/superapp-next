-- Create mp_ads_shopee table for Shopee marketplace ad data
CREATE TABLE marketing.mp_ads_shopee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    produk VARCHAR(255) NOT NULL,
    impression INT NOT NULL DEFAULT 0,
    click INT NOT NULL DEFAULT 0,
    ctr DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    qty_buyer INT NOT NULL DEFAULT 0,
    qty_produk INT NOT NULL DEFAULT 0,
    omset DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    spent DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    roas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cancel_qty INT NOT NULL DEFAULT 0,
    cancel_omset DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    roas_fix DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    target_roas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mp_ads_shopee_date ON marketing.mp_ads_shopee(date);
CREATE INDEX IF NOT EXISTS idx_mp_ads_shopee_produk ON marketing.mp_ads_shopee(produk);

-- Create mp_ads_tiktok table for TikTok marketplace ad data
CREATE TABLE marketing.mp_ads_tiktok (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    produk VARCHAR(255) NOT NULL,
    impression INT NOT NULL DEFAULT 0,
    click INT NOT NULL DEFAULT 0,
    ctr DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    qty_buyer INT NOT NULL DEFAULT 0,
    qty_produk INT NOT NULL DEFAULT 0,
    omset DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    spent DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    roas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cancel_qty INT NOT NULL DEFAULT 0,
    cancel_omset DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    roas_fix DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    target_roas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mp_ads_tiktok_date ON marketing.mp_ads_tiktok(date);
CREATE INDEX IF NOT EXISTS idx_mp_ads_tiktok_produk ON marketing.mp_ads_tiktok(produk);