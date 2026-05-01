-- Create daily_uploads table for IG/TikTok/YouTube content tracking
CREATE TABLE marketing.daily_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal_aktivitas DATE NOT NULL,
    akun VARCHAR(50) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    jenis_konten VARCHAR(50) NOT NULL,
    tipe_aktivitas VARCHAR(50) NOT NULL,
    produk VARCHAR(255) NOT NULL,
    link_konten VARCHAR(500) NOT NULL,
    pic VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_daily_uploads_tanggal ON marketing.daily_uploads(tanggal_aktivitas);
CREATE INDEX IF NOT EXISTS idx_daily_uploads_platform ON marketing.daily_uploads(platform);
CREATE INDEX IF NOT EXISTS idx_daily_uploads_status ON marketing.daily_uploads(status);
