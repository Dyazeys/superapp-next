# Known Issues (SuperApp Next ERP)

Tanggal: `2026-04-11`

## Open

1. Belum ada sign-off bisnis final untuk production.
2. Validasi role user operasional (non-superadmin) belum dituntaskan end-to-end.
3. Rekonsiliasi bisnis dengan data transaksi nyata masih berjalan (gross/net payout dan stock sample nyata).

## Resolved

1. Koneksi DB lokal `127.0.0.1:55432` sempat gagal, sudah pulih.
2. API `PATCH /api/warehouse/inbound/:id/items/:itemId` gagal karena `.partial()` pada schema refine, sudah diperbaiki.
3. Alur write E2E (sales, warehouse, payout) sudah lulus termasuk cleanup data uji.
4. Backup/restore drill ke DB terpisah sudah lulus.
