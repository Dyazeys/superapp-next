# SOP Deploy Migration ke Production

Tanggal: `2026-05-02`

## 1. Masalah

`prisma migrate deploy` tidak bisa digunakan di production karena:

- Table `_prisma_migrations` tidak ada di production (project dimulai tanpa Prisma migrate)
- Beberapa table dimiliki oleh user `postgres`, bukan `superapp_app` (user aplikasi)
- Prisma hanya punya akses sebagai `superapp_app`

Akibatnya, setiap ada perubahan schema (kolom baru, index baru) di `schema.prisma`, Prisma akan error karena kolom di database tidak cocok dengan model.

## 2. Cara Deteksi Dini

### 2.1 Production Schema Audit

Jalankan script schema audit sebelum dan sesudah development:

```bash
# Pastikan tunnel DB sudah jalan
node scripts/db-tunnel.mjs

# Jalankan audit
node scripts/schema-audit.mjs
```

Script ini akan membandingkan `prisma/schema.prisma` dengan database production dan melaporkan kolom/index yang hilang.

### 2.2 Monitoring Error

Cek log aplikasi untuk error pattern ini:

```
error: column "nama_kolom" does not exist
```

Error di atas menandakan ada drift antara schema Prisma dan database.

## 3. Prosedur Deploy Migration

### Langkah 1: Buat File SQL Migration

Buat file SQL di `prisma/migrations/[timestamp]_[deskripsi]/migration.sql`.

Gunakan timestamp format: `YYYYMMDD`.

Contoh: `prisma/migrations/20260502_add_payout_posting_columns/migration.sql`

Isi file SQL dengan statement DDL yang diperlukan:

```sql
-- Contoh: tambah kolom + index
ALTER TABLE payout.t_payout ADD COLUMN IF NOT EXISTS post_status VARCHAR NOT NULL DEFAULT 'DRAFT';
ALTER TABLE payout.t_payout ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE payout.t_payout ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE payout.t_payout ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payout_t_payout_post_status ON payout.t_payout(post_status);
```

**PENTING:** Gunakan `IF NOT EXISTS` untuk idempotensi — aman dijalankan berkali-kali.

### Langkah 2: JALANKAN Migration via SSH (User postgres)

Karena table dimiliki oleh `postgres`, migration HARUS dijalankan sebagai user `postgres` langsung di server.

```bash
# Dari laptop development, jalankan via SSH langsung ke production:
ssh opsadmin@217.15.162.20 "sudo -u postgres psql superapp_db -f -" < prisma/migrations/TIMESTAMP_DESKRIPSI/migration.sql
```

Output yang diharapkan:
```
ALTER TABLE
CREATE INDEX
```

### Langkah 3: Verifikasi Kolom/Index

```bash
# Cek kolom
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_schema='payout' AND table_name='t_payout' AND column_name IN ('post_status','posted_at');"

# Cek index
psql "$DATABASE_URL" -c "SELECT indexname FROM pg_indexes WHERE schemaname='payout' AND tablename='t_payout' AND indexname='idx_payout_t_payout_post_status';"
```

### Langkah 4: Deploy Kode Aplikasi

Setelah migration SQL berhasil, deploy kode aplikasi yang menggunakan kolom baru.

```bash
git push origin main
# Trigger deploy ke production (Vercel/Railway/dll)
```

### Langkah 5: Smoke Test

```bash
# Test API endpoint yang menggunakan kolom baru
curl -s -o /dev/null -w "%{http_code}" https://erp.superapp.com/api/payout/records
```

Hasil yang diharapkan: `200` atau `401` (auth), BUKAN `500` (server error).

## 4. Checklist Deployment

- [ ] `schema.prisma` sudah di-update dengan kolom/index baru
- [ ] File SQL migration sudah dibuat di `prisma/migrations/`
- [ ] Migration SQL sudah dijalankan di production (via SSH sebagai postgres)
- [ ] Kolom/index terverifikasi ada di database
- [ ] Kode aplikasi sudah di-deploy
- [ ] Smoke test API endpoint berhasil (tidak 500)
- [ ] `scripts/schema-audit.mjs` dijalankan untuk konfirmasi zero drift

## 5. Referensi

- Schema audit script: `scripts/schema-audit.mjs`
- DB tunnel script: `scripts/db-tunnel.mjs`