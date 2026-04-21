# Data Classification & Channel Settlement

Tanggal update: `2026-04-21`

Dokumen ini dipakai untuk mencegah kebingungan saat membedakan:
- mana yang termasuk master data
- mana yang termasuk data transaksi
- mana yang termasuk saldo / state turunan
- mana yang termasuk histori / audit
- channel mana yang memakai flow saldo dan mana yang direct

## 1) Klasifikasi Data per Modul

### Master Data

Data referensi yang disiapkan lebih dulu sebelum transaksi berjalan.

- `channel.m_channel_group`
- `channel.m_channel_category`
- `channel.m_channel`
- `sales.master_customer`
- `product.category_product`
- `product.master_inventory`
- `product.master_product`
- `product.product_bom`
- `warehouse.master_vendor`
- `accounting.account_categories`
- `accounting.accounts`

Catatan:
- `sales.master_customer` bersifat opsional untuk flow order jika `customer_id` tidak diisi.
- `product.product_bom` tetap dianggap master karena isinya konfigurasi komponen produk, bukan kejadian transaksi.

### Data Transaksi

Data kejadian operasional berjalan.

- `sales.t_order`
- `sales.t_order_item`
- `warehouse.purchase_orders`
- `warehouse.inbound_deliveries`
- `warehouse.inbound_items`
- `warehouse.returns`
- `warehouse.adjustments`
- `warehouse.stock_movements`
- `payout.t_payout`
- `payout.t_adjustments`
- `payout.payout_transfers`
- `accounting.journal_entries`
- `accounting.journal_lines`
- `accounting.operational_expenses`

Catatan:
- `accounting.operational_expenses` secara bisnis adalah kejadian biaya, jadi diperlakukan sebagai transaksi, bukan master.

### Saldo / Derived Operational State

Data posisi akhir / ringkasan yang biasanya berasal dari transaksi atau proses sinkronisasi.

- `warehouse.stock_balances`

Catatan:
- `warehouse.stock_balances` bukan transaksi mentah.
- Nilainya harus konsisten dengan `warehouse.stock_movements`.

### Histori / Audit

Data jejak perubahan yang membantu pelacakan, bukan master inti dan bukan transaksi utama.

- `product.hpp_history`
- `auth.roles`
- `auth.users`

Catatan:
- `auth.roles` dan `auth.users` tetap master untuk akses aplikasi, tetapi bukan master operasional bisnis.
- Dalam konteks kesiapan transaksi bisnis, keduanya biasanya bukan blocker utama.

## 2) Implikasi Operasional

### Sebelum input transaksi sales

Minimal yang harus siap:

- `channel.m_channel`
- `product.category_product`
- `product.master_inventory`
- `product.master_product`
- `product.product_bom`
- `warehouse.stock_balances`

Tambahan yang disarankan:

- `accounting.account_categories`
- `accounting.accounts`
- `warehouse.master_vendor`

Opsional:

- `sales.master_customer`

## 3) Klasifikasi Channel: SALDO vs DIRECT

### Definisi

- `SALDO`: channel yang memakai `saldo_account_id` dan siap dipakai pada flow payout transfer / penampungan saldo.
- `DIRECT`: channel yang tidak memakai flow saldo saat ini. Channel ini tidak dianggap blocker walau `saldo_account_id` kosong.

### Channel dengan flow `SALDO`

- `Akulaku`
- `Lazada`
- `Shopee`
- `Tiktok`
- `Tokopedia`
- `Web RIMC`

### Channel dengan flow `DIRECT`

- `90 Helmet`
- `Boshelm`
- `Boshelm Dropship`
- `Bulls Syndicate`
- `Central Project`
- `Earthspace`
- `Jual Helm`
- `Kustomfest`
- `Manual`
- `Mr Helm`
- `Mr Helm Dropship`
- `Pickers Bandung`
- `Pickers Jakarta`
- `Shindu Asri Helmet`

## 4) Aturan Praktis Agar Tidak Keliru

- Jangan anggap semua channel wajib punya `saldo_account_id`.
- `saldo_account_id` wajib untuk flow payout transfer, bukan untuk semua channel.
- Untuk channel `DIRECT`, fokus utama biasanya cukup di:
  - `revenue_account_id`
  - `piutang_account_id` jika memang dipakai
- Untuk channel `SALDO`, mapping berikut harus lengkap:
  - `piutang_account_id`
  - `revenue_account_id`
  - `saldo_account_id`

## 5) Ringkasan Cepat

- `product_bom` = master
- `stock_balances` = saldo/state, bukan transaksi
- `operational_expenses` = transaksi
- `master_customer` = opsional
- tidak semua channel butuh saldo
- payout transfer hanya aman untuk channel `SALDO`
