# Warehouse Return Flow — Desain Data

## Tabel Baru

### `warehouse_returns` (schema: warehouse)
Header retur gudang untuk sales yang status `RETUR`.

| Kolom | Type | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | gen_random_uuid() |
| ref_no | String(100) | UNIQUE, FK → sales.t_order.ref_no | ref_no dari sales order |
| return_date | Date | NOT NULL | tanggal retur |
| status | String(20) | NOT NULL, default 'PENDING' | PENDING → RECEIVED_GOOD / RECEIVED_DAMAGED |
| verified_by | String(100) | NOT NULL | user yang verifikasi |
| verified_at | Timestamptz | NULL | timestamp saat verifikasi |
| notes | Text | NULL | catatan internal |
| created_at | Timestamptz | default now() | |
| updated_at | Timestamptz | NULL | |

Relasi:
- `t_order`: one-to-one via `ref_no`

### `warehouse_return_items` (schema: warehouse)
Item detail dari retur gudang.

| Kolom | Type | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK | gen_random_uuid() |
| return_id | UUID | FK → warehouse_returns.id, ON DELETE CASCADE | header id |
| sku | String(100) | FK → product.master_product.sku | SKU produk |
| inv_code | String(100) | FK → product.master_inventory.inv_code | inventory item |
| qty_returned | Int | NOT NULL | qty dari sales order original |
| qty_good | Int | NULL (set saat verifikasi) | qty barang baik |
| qty_damaged | Int | NULL (set saat verifikasi) | qty barang rusak |
| unit_cost | Decimal(18,2) | NULL | HPP terkini saat verifikasi |
| notes | Text | NULL | |
| created_at | Timestamptz | default now() | |

Unique constraint: (return_id, sku) — idempotency per item

## State Machine

```
[PENDING]
   ├─→ RECEIVED_GOOD   (post stock masuk)
   └─→ RECEIVED_DAMAGED (tidak post stock, catat jurnal COA retur rusak)
```

State final (RECEIVED_GOOD / RECEIVED_DAMAGED) tidak boleh balik ke PENDING.

## Idempotency Guard

- Satu `return_item` hanya boleh dipost stock maksimal 1x.
- Guard: cek `stock_movements` dengan `reference_type = 'WAREHOUSE_RETURN'` AND `reference_id = return_item.id` — jika sudah ada, tolak.
- Filter sales kandidat: cek apakah `ref_no` sudah ada di `warehouse_returns` — jika sudah, tidak muncul di daftar kandidat.

## Stock Posting Rule

### RECEIVED_GOOD
1. Insert `stock_movements` (+qty_good, reference_type='WAREHOUSE_RETURN', reference_id=return_item.id)
2. Update `stock_balances` (qty_on_hand += qty_good)

### RECEIVED_DAMAGED
1. Insert `stock_movements` (0, reference_type='WAREHOUSE_RETURN_DAMAGED', reference_id=return_item.id) — tracking saja
2. Tidak update stock balance (barang rusak tidak masuk stok jual)
3. Catat di notes untuk referensi jurnal COA retur barang rusak (offline/manual dulu)