# Runbook Data Import Sequence

Tanggal: `2026-04-13`

Dokumen ini jadi urutan baku import data agar aman terhadap dependensi FK.

## Urutan Import (Direkomendasikan)

1. `product_category`
2. `inventory` (kolom CSV `unit_price`)
3. `product`
4. `vendor`
5. `customer`
6. Data warehouse transaksi (`purchase_orders`, `inbound_deliveries`, `inbound_items`, `returns`)
7. Data transaksi sales/payout (jika diperlukan untuk cutover)

## Precheck Wajib per Batch

1. Backup DB terbaru tersedia.
2. Header CSV cocok dengan template resmi:
- `docs/imports/master-data/templates/`
3. Referensi FK sudah ada:
- `product.category_code` harus ada di `category_product`.
- `product.inv_main` dan `product.inv_acc` harus ada di `master_inventory`.
4. Tidak ada duplicate pada business key utama:
- `category_code`, `inv_code`, `sku`, `vendor_code`, `email+phone` (customer sesuai kebijakan data).

## Eksekusi Import Master

Endpoint:
- `POST /api/imports/master-data/{master}`

Mode:
- `upsert` untuk sinkronisasi data terbaru.
- `skip_duplicate` untuk append-only import.

## Postcheck Wajib

1. Simpan ringkasan hasil import:
- total/success/created/updated/skipped/error
2. Validasi jumlah row source vs target.
3. Validasi sample record di UI (minimal 5 row acak per master).
4. Untuk inventory/product, cek endpoint:
- `/api/product/inventory`
- `/api/product/products`

## Catatan Operasional Saat Ini

Status per `2026-04-13`:
- `product_category`, `inventory`, `product` sudah diimport.
- Saldo stok awal sudah diinisialisasi terpisah (lihat `docs/stock-opening-balance-sop.md`).
- `vendor` dan `customer` menunggu file final dari admin.
