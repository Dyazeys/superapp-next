# Master Data CSV Import

Folder ini menyiapkan format CSV untuk import **master data saja**.

## Scope yang didukung

- `channel`
- `customer`
- `product_category`
- `product`
- `product_bom`
- `inventory`
- `vendor`

Semua import berjalan lewat endpoint:

- `POST /api/imports/master-data/{master}`

Dengan `multipart/form-data`:

- `file`: file `.csv`
- `mode`: `upsert` atau `skip_duplicate`

## Catatan format

- Header wajib mengikuti template persis (huruf kecil + underscore).
- Header di luar daftar yang diizinkan akan ditolak.
- Untuk master `inventory`, gunakan kolom harga `unit_price` (pengganti `hpp` di file CSV).
- Untuk master `product`, kolom `price_mp` dan `price_non_mp` sudah deprecated di alur aplikasi. Jika CSV lama masih menyertakan kolom tersebut, import tetap menerima selama kolom wajib valid.
- Referensi antar master wajib sudah ada:
  - `product.category_code` harus ada di `product_category`.
  - `product.inv_main` dan `product.inv_acc` harus ada di `inventory`.
  - `channel.*_account_code` harus ada di `accounting.accounts.code`.
- Untuk `channel`, `group_name` dan `category_name` dapat dibuat otomatis jika belum ada.
- Untuk `product_bom`, import hanya meng-update row BOM yang sudah ada berdasarkan key:
  - `sku`
  - `component_group`
  - `component_type`
  - `inv_code`
  - `sequence_no`
- Jika key BOM tersebut tidak ketemu di database, row akan gagal dan tidak dibuatkan row baru.

## Ringkasan hasil import

Response menyertakan ringkasan:

- `total_rows`
- `success_rows`
- `created_rows`
- `updated_rows`
- `skipped_rows`
- `error_rows`
- `errors[]` (row + message)

## Template CSV

Lihat folder:

- `docs/imports/master-data/templates/channel.csv`
- `docs/imports/master-data/templates/customer.csv`
- `docs/imports/master-data/templates/product_category.csv`
- `docs/imports/master-data/templates/product.csv`
- `docs/imports/master-data/templates/product_bom.csv`
- `docs/imports/master-data/templates/inventory.csv`
- `docs/imports/master-data/templates/vendor.csv`
