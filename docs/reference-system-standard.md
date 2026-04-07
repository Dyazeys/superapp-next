# Reference System Standard

Dokumen ini mendefinisikan standar reference identifier untuk transaksi sales, payout, warehouse, dan accounting.

Scope:
- Tidak mengubah data lama.
- Berlaku untuk penulisan data baru dan refactor ke depan.
- Membedakan identifier bisnis yang dibaca user dengan identifier teknis yang dipakai untuk relasi dan idempotency.

## 1. Daftar Reference Yang Ada Saat Ini

### Order
- `sales.t_order.order_no`
  - Tipe: `varchar(50)`
  - Fungsi: primary key internal order.
  - Dipakai oleh:
    - `sales.t_order_item.order_no`
    - `sales.t_order.parent_order_no`
    - route API sales untuk lookup dan update order
- `sales.t_order.ref_no`
  - Tipe: `varchar(100)`, unique, nullable
  - Fungsi: external marketplace reference / nomor referensi channel.
  - Dipakai oleh:
    - `payout.t_payout.ref`
    - `payout.t_adjustments.ref`
    - lookup payout ke order
- `sales.t_order.parent_order_no`
  - Tipe: `varchar(50)`, nullable
  - Fungsi: reference internal order-to-order.
  - Catatan: bukan external reference.

### Order Item
- `sales.t_order_item.id`
  - Tipe: `int`, auto increment
  - Fungsi: primary key internal order item.
  - Dipakai oleh:
    - `warehouse.stock_movements.reference_type = SALE`
    - `warehouse.stock_movements.reference_id = String(order_item.id)`
- `sales.t_order_item.order_no`
  - Tipe: `varchar(50)`, nullable FK ke `t_order.order_no`
  - Fungsi: link item ke order induk.

### Payout
- `payout.t_payout.payout_id`
  - Tipe: `int`, auto increment
  - Fungsi: primary key internal payout.
- `payout.t_payout.ref`
  - Tipe: `varchar(100)`, unique, nullable
  - Fungsi: foreign reference ke `sales.t_order.ref_no`.
  - Artinya: payout terhubung ke order melalui external marketplace reference, bukan `order_no`.

### Stock Movement
- `warehouse.stock_movements.reference_type`
  - Tipe: `varchar(50)`
  - Fungsi: namespace sumber movement.
- `warehouse.stock_movements.reference_id`
  - Tipe: `varchar(100)`
  - Fungsi: identifier record sumber sesuai `reference_type`.
- Nilai yang dipakai saat ini:
  - `INBOUND` -> `reference_id = inbound_items.id`
  - `ADJUSTMENT` -> `reference_id = adjustments.id`
  - `SALE` -> `reference_id = String(t_order_item.id)`
- Catatan:
  - Stock movement tidak menyimpan `order_no` atau `ref_no` sebagai key utama.
  - Untuk transaksi sale, granularitasnya ada di level `order_item`, bukan `order`.

### Journal
- `accounting.journal_entries.reference_type`
  - Tipe: `varchar(50)`
  - Fungsi: namespace sumber jurnal.
- `accounting.journal_entries.reference_id`
  - Tipe saat ini: `uuid`, nullable
  - Fungsi: identifier teknis sumber jurnal.
- Nilai yang dipakai saat ini:
  - `PAYOUT_SETTLEMENT` -> `reference_id = deterministic UUID dari payout_id`
- Catatan penting:
  - Karena kolom `reference_id` bertipe `uuid`, nilai seperti `order_no`, `ref_no`, atau `payout_id` tidak bisa disimpan apa adanya.
  - Implementasi sekarang memakai UUID deterministik untuk menjaga idempotency posting payout journal.

## 2. Aturan Standar Penggunaan Identifier

### Kapan pakai `order_no`
Gunakan `order_no` sebagai reference utama untuk seluruh proses internal sales.

Pakai `order_no` untuk:
- lookup, update, delete, dan relasi internal order
- relasi `order_item -> order`
- parent/child order
- tampilan admin/backoffice
- cross-module reference internal yang memang menunjuk dokumen order

Jangan pakai `order_no` untuk:
- menyambungkan payout marketplace ke order
- menggantikan `order_item.id` di stock movement
- menggantikan technical `reference_id` journal yang wajib UUID

### Kapan pakai `ref_no`
Gunakan `ref_no` hanya sebagai external business reference dari marketplace/channel.

Pakai `ref_no` untuk:
- import dan rekonsiliasi data dari marketplace
- relasi `payout.ref -> order.ref_no`
- relasi `adjustment.ref -> order.ref_no`
- pencarian berdasarkan nomor referensi eksternal
- tampilan user-facing saat konteksnya marketplace settlement

Jangan pakai `ref_no` untuk:
- primary key internal order
- relasi `order_item`
- `stock_movements.reference_id`
- `journal_entries.reference_id`

### Kapan pakai `payout_id`
Gunakan `payout_id` sebagai identifier utama record payout di sistem internal.

Pakai `payout_id` untuk:
- operasi CRUD payout
- audit trail internal payout
- source identity untuk posting journal payout
- relasi teknis antarmodule yang menunjuk record payout

Jangan pakai `payout_id` untuk:
- menggantikan `ref_no` saat mencocokkan payout dengan order marketplace
- tampilan utama ke user jika yang dibutuhkan adalah nomor referensi marketplace

## 3. Standar Per Entitas

### Order
- Canonical internal identifier: `order_no`
- Canonical external identifier: `ref_no`
- Aturan:
  - satu order internal harus selalu diacu dengan `order_no`
  - `ref_no` opsional dan hanya dipakai bila order berasal dari channel/marketplace

### Order Item
- Canonical identifier: `t_order_item.id`
- Context identifier: `order_no`
- Aturan:
  - untuk relasi teknis per baris item, selalu pakai `t_order_item.id`
  - untuk display boleh tampilkan `order_no` + item detail, tapi bukan sebagai key pengganti

### Payout
- Canonical internal identifier: `payout_id`
- Marketplace link identifier: `ref` yang harus berisi nilai `order.ref_no`
- Aturan:
  - `payout_id` mengidentifikasi record payout
  - `ref` hanya mengidentifikasi order marketplace yang diselesaikan payout

### Stock Movement
- Canonical identifier: pasangan `reference_type + reference_id`
- Aturan:
  - `reference_type` wajib menunjukkan tabel/sumber asli movement
  - `reference_id` wajib berisi identifier record sumber, bukan nomor tampilan

Standar final stock movement:
- `INBOUND` -> `reference_id = warehouse.inbound_items.id`
- `ADJUSTMENT` -> `reference_id = warehouse.adjustments.id`
- `SALE` -> `reference_id = String(sales.t_order_item.id)`

## 4. Standar Final Untuk Journal Entries

Prinsip:
- Journal harus menunjuk source document yang membangkitkan posting.
- `reference_type` tidak boleh bebas; harus dari controlled vocabulary.
- `reference_id` adalah technical source id untuk idempotency dan traceability.
- Karena kolom saat ini bertipe `uuid`, semua source journal harus dipetakan ke UUID canonical.

### Valid `reference_type`
Nilai valid ke depan:
- `PAYOUT_SETTLEMENT`
- `SALES_ORDER`
- `SALES_ORDER_ITEM`
- `WAREHOUSE_INBOUND_ITEM`
- `WAREHOUSE_ADJUSTMENT`

### Isi `reference_id` per type
- `PAYOUT_SETTLEMENT`
  - isi dengan UUID deterministik dari `payout_id`
  - business identifier yang wajib ikut di description/memo: `payout_id` dan `ref_no`
- `SALES_ORDER`
  - isi dengan UUID deterministik dari `order_no`
  - business identifier yang wajib ikut di description/memo: `order_no`, dan `ref_no` bila ada
- `SALES_ORDER_ITEM`
  - isi dengan UUID deterministik dari `t_order_item.id`
  - business identifier yang wajib ikut di description/memo: `order_item.id` dan `order_no`
- `WAREHOUSE_INBOUND_ITEM`
  - isi langsung dengan `warehouse.inbound_items.id`
  - business identifier tambahan yang boleh ikut di description/memo: `surat_jalan_vendor` atau nomor PO bila relevan
- `WAREHOUSE_ADJUSTMENT`
  - isi langsung dengan `warehouse.adjustments.id`
  - business identifier tambahan yang boleh ikut di description/memo: `approved_by`, `reason`, atau nomor dokumen manual bila ada

### Aturan pemetaan UUID
- Bila source primary key sudah UUID, simpan apa adanya ke `journal_entries.reference_id`.
- Bila source primary key bukan UUID, gunakan UUID deterministik yang dibentuk dari:
  - namespace tetap per `reference_type`
  - canonical identifier sumber
- Namespace harus stabil dan versioned, contoh pola:
  - `superapp:journal:sales-order:v1`
  - `superapp:journal:sales-order-item:v1`
  - `superapp:journal:payout-settlement:v1`

### Aturan yang tidak boleh dilanggar
- `journal_entries.reference_id` tidak boleh diisi `order_no` mentah.
- `journal_entries.reference_id` tidak boleh diisi `ref_no` mentah.
- `journal_entries.reference_id` tidak boleh diisi `payout_id` mentah.
- `ref_no` tidak boleh dipakai sebagai technical key journal.
- Satu source document hanya boleh punya satu semantic journal header untuk `reference_type` yang sama.

## 5. Format Standar Final

### Ringkasan identifier utama
- Order internal: `order_no`
- Order external marketplace: `ref_no`
- Order item internal: `t_order_item.id`
- Payout internal: `payout_id`
- Stock movement source key: `reference_type + reference_id`
- Journal source key: `reference_type + reference_id`

### Format final per modul
- `sales.t_order`
  - internal key: `order_no`
  - external key: `ref_no`
- `sales.t_order_item`
  - internal key: `id`
  - parent key: `order_no`
- `payout.t_payout`
  - internal key: `payout_id`
  - order link key: `ref -> t_order.ref_no`
- `warehouse.stock_movements`
  - `INBOUND / inbound_items.id`
  - `ADJUSTMENT / adjustments.id`
  - `SALE / String(t_order_item.id)`
- `accounting.journal_entries`
  - `PAYOUT_SETTLEMENT / UUID(payout_id)`
  - `SALES_ORDER / UUID(order_no)`
  - `SALES_ORDER_ITEM / UUID(order_item.id)`
  - `WAREHOUSE_INBOUND_ITEM / inbound_items.id`
  - `WAREHOUSE_ADJUSTMENT / adjustments.id`

## 6. Keputusan Final

- `order_no` adalah canonical internal reference untuk order.
- `ref_no` adalah canonical external marketplace reference untuk order.
- `payout_id` adalah canonical internal reference untuk payout.
- `stock_movements` harus selalu refer ke source record paling granular.
- `journal_entries` harus memakai controlled `reference_type` dan `reference_id` teknis yang stabil.
- Untuk journal, business reference tetap tampil di `description` atau `memo`, bukan dipaksakan ke `reference_id`.
- Data lama tidak diubah; standar ini hanya menjadi aturan penulisan dan refactor ke depan.
