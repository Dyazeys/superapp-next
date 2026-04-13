# SOP Saldo Stok Awal

Tanggal: `2026-04-13`

SOP ini dipakai saat inisialisasi ulang saldo stok awal agar data bersih dan konsisten.

## Sumber Data

- File: `data/master-upload/saldo-stok-awal.csv`
- Format minimum:
- `inv_code`
- `qty_on_hand`

## Precheck

1. Semua `inv_code` pada CSV harus sudah ada di `product.master_inventory`.
2. `qty_on_hand` harus integer valid.
3. Tidak boleh ada duplikat `inv_code` pada file.
4. Backup DB harus tersedia sebelum eksekusi.

## Langkah Eksekusi Aman

Eksekusi dalam transaksi DB:

1. Hapus data stok historis lama:
- `warehouse.returns`
- `warehouse.inbound_items`
- `warehouse.inbound_deliveries`
- `warehouse.adjustments`
- `warehouse.stock_movements`
- `warehouse.stock_balances`
- `warehouse.purchase_orders`
2. Insert ulang `warehouse.stock_balances` dari CSV.
3. Insert `warehouse.stock_movements` sebagai jejak pembukaan saldo.

## Constraint Penting

`warehouse.stock_movements.reference_type` dibatasi check constraint.

Nilai valid saat ini:
- `INBOUND`
- `SALE`
- `ADJUSTMENT`
- `RETURN`

Karena itu, untuk saldo awal gunakan:
- `reference_type = ADJUSTMENT`
- `reference_id = SALDO-AWAL-YYYY-MM-DD`
- `notes = Initial stock import from saldo-stok-awal.csv`

## Verifikasi Setelah Eksekusi

1. Hitung row:
- `stock_balances` = jumlah row CSV
- `stock_movements` = jumlah row CSV
2. Cek total qty:
- `sum(stock_balances.qty_on_hand)` sesuai source CSV
3. Pastikan tabel histori stok lama sudah bersih sesuai scope.

## Referensi Hasil Terakhir

- Report: `docs/reports/stock-opening-import-2026-04-13T08-03-30-747Z.json`
