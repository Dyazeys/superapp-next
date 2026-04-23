# Known Issues (SuperApp Next ERP)

Tanggal: `2026-04-23`

## Open

1. Belum ada sign-off bisnis final untuk production.
2. Validasi role user operasional (non-superadmin) belum dituntaskan end-to-end.
3. Rekonsiliasi bisnis dengan data transaksi nyata masih berjalan (gross/net payout + sample transaksi operasional nyata).
4. Master `vendor` dan `customer` final dari admin belum diimport ke DB UAT.
5. Audit Warehouse Inbound (22 April 2026) menemukan risiko bypass flow posting:
   - `qc_status` masih bisa di-set langsung saat create/update inbound tanpa lewat endpoint post.
   - Risiko: status `POSTED` bisa terjadi tanpa jaminan proses posting inbound sesuai flow resmi.
6. Audit Warehouse Inbound (22 April 2026) menemukan endpoint item by-id belum mengikat parent inbound id pada path:
   - Endpoint `/api/warehouse/inbound/:id/items/:itemId` mengambil item berdasar `itemId` saja.
   - Risiko: operasi lintas inbound id pada URL tidak tervalidasi ketat.
7. Posting jurnal untuk warehouse inbound/adjustment masih belum difinalkan (sengaja di-hold):
   - Keputusan sementara UAT: fokus Income Statement dulu.
   - Posting aset dagang/balance sheet menunggu keputusan owner terkait metode valuasi.
8. Jurnal otomatis dari sales order sedang di-hold:
   - Flow sales aktif saat ini hanya sampai order, item, dan stock movement.
   - Jangan anggap tidak adanya jurnal sales sebagai bug selama keputusan hold ini masih berlaku.
9. Source jurnal Income Statement untuk penjualan sudah dipindah ke payout:
   - `sales.t_order` tetap dipakai sebagai data operasional dan referensi.
   - Pembacaan `revenue`, `hpp`, `fee`, dan `saldo` untuk jurnal penjualan mengikuti data payout.

## Resolved

1. Koneksi DB lokal `127.0.0.1:55432` sempat gagal, sudah pulih.
2. API `PATCH /api/warehouse/inbound/:id/items/:itemId` gagal karena `.partial()` pada schema refine, sudah diperbaiki.
3. Alur write E2E (sales, warehouse, payout) sudah lulus termasuk cleanup data uji.
4. Backup/restore drill ke DB terpisah sudah lulus.
5. Import master `inventory` dan `product` dari CSV aktual sudah berhasil.
6. Saldo stok awal sudah di-reset dan diimport ulang dari `data/master-upload/saldo-stok-awal.csv`.
7. Login lokal sempat gagal karena kombinasi env parsing + stale process, sudah ditangani lewat hardening auth dan restart dev process bersih.
8. Data transaksi uji telah dibersihkan (22 April 2026) agar UAT mulai dari awal:
   - warehouse: inbound, inbound items, returns, adjustments, PO, stock movements, stock balances
   - sales: order, order items
   - payout: payout, transfers, adjustments
   - accounting: operational expenses, journals, journal lines
