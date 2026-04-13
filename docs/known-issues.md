# Known Issues (SuperApp Next ERP)

Tanggal: `2026-04-13`

## Open

1. Belum ada sign-off bisnis final untuk production.
2. Validasi role user operasional (non-superadmin) belum dituntaskan end-to-end.
3. Rekonsiliasi bisnis dengan data transaksi nyata masih berjalan (gross/net payout + sample transaksi operasional nyata).
4. Master `vendor` dan `customer` final dari admin belum diimport ke DB UAT.

## Resolved

1. Koneksi DB lokal `127.0.0.1:55432` sempat gagal, sudah pulih.
2. API `PATCH /api/warehouse/inbound/:id/items/:itemId` gagal karena `.partial()` pada schema refine, sudah diperbaiki.
3. Alur write E2E (sales, warehouse, payout) sudah lulus termasuk cleanup data uji.
4. Backup/restore drill ke DB terpisah sudah lulus.
5. Import master `inventory` dan `product` dari CSV aktual sudah berhasil.
6. Saldo stok awal sudah di-reset dan diimport ulang dari `data/master-upload/saldo-stok-awal.csv`.
7. Login lokal sempat gagal karena kombinasi env parsing + stale process, sudah ditangani lewat hardening auth dan restart dev process bersih.
