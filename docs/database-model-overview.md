# Database Model Overview (Ringkas)

Dokumen ini menjelaskan model database inti SuperApp secara singkat dan padat.

## Update Terakhir (23 April 2026)

- Jurnal otomatis untuk `sales.t_order_item` sedang di-`hold`.
- Flow sales aktif saat ini difokuskan ke data order, item, dan mutasi stok; jurnal payout/transfer tetap aktif.
- Untuk kebutuhan Income Statement, source jurnal penjualan saat ini dipusatkan di `payout.t_payout`:
  - `revenue` dibaca dari `total_price`
  - `hpp` dibaca dari `hpp`
  - `fee marketplace` dibaca dari kolom fee payout
  - `saldo channel` dibaca dari `omset`

## Update Sebelumnya (20 April 2026)

- `warehouse.adjustments` sekarang punya kolom `notes` (catatan adjustment).
- Input `warehouse.adjustments.adj_type` dibatasi ke `IN` / `OUT`.
- Input `warehouse.adjustments.reason` dibatasi ke daftar reason operasional berikut:
  - `Loss`
  - `Surplus`
  - `Rijek`
  - `Event Masuk`
  - `Event Keluar`
  - `Konsinyasi Masuk`
  - `Konsinyasi Keluar`
  - `Inventaris Konten`
  - `Sampel Produk`
  - `Display`
  - `Tukar Produk`
- Setiap create/update/delete `warehouse.adjustments` disinkronkan ke `warehouse.stock_movements` dengan:
  - `reference_type = ADJUSTMENT`
  - `reference_id = adjustments.id`

## Update Sebelumnya (13 April 2026)

- Import `master inventory` sekarang memakai kolom CSV `unit_price` (fallback ke `hpp` jika file lama), lalu dipetakan ke kolom DB `product.master_inventory.hpp`.
- Untuk data awal, `unit_price` kosong diperbolehkan dan otomatis dibaca sebagai `0`.
- Alur aplikasi untuk `master product` sudah tidak lagi memakai `price_mp` dan `price_non_mp` (UI, schema validasi, API, importer).
- Harga MP/non-MP akan dipindah ke tabel pricing khusus di fase berikutnya.
- Catatan DB fisik: drop kolom `price_mp` dan `price_non_mp` butuh user owner tabel (`postgres`), karena user app saat ini (`superapp_app`) tidak punya privilege DDL.

## Cakupan Schema

Database PostgreSQL dipisah per domain:
- `auth`: autentikasi dan role user
- `channel`: master channel marketplace
- `sales`: order dan customer
- `product`: master produk, kategori, inventory, BOM
- `warehouse`: inbound, stock, adjustment, vendor
- `payout`: settlement payout marketplace
- `accounting`: chart of accounts, jurnal, biaya operasional

## Entitas Inti per Domain

### 1) Auth
- `users` -> akun login aplikasi
- `roles` -> role + permissions (JSON)
- Relasi: `users.role_id -> roles.id`

### 2) Channel
- `m_channel_group` -> grup channel
- `m_channel_category` -> kategori channel
- `m_channel` -> channel utama
- Relasi: group -> category -> channel
- Catatan: `m_channel` juga menyimpan mapping akun accounting (`piutang/revenue/saldo`)

### 3) Sales
- `t_order` -> header order (PK: `order_no`, external ref: `ref_no`)
- `t_order_item` -> item order
- `master_customer` -> customer
- Relasi:
  - `t_order_item.order_no -> t_order.order_no`
  - `t_order.customer_id -> master_customer.customer_id`
  - `t_order.channel_id -> channel.m_channel.channel_id`

### 4) Product
- `master_product` -> SKU produk jadi
- `master_inventory` -> item inventory/material
- `category_product` -> kategori produk (hierarkis parent-child)
- `product_bom` -> komponen BOM per SKU
- `hpp_history` -> histori perubahan HPP
- Catatan pricing: `price_mp` dan `price_non_mp` sudah deprecated di level aplikasi.
- Relasi utama:
  - `master_product.category_code -> category_product.category_code`
  - `product_bom.sku -> master_product.sku`
  - `product_bom.inv_code -> master_inventory.inv_code`

### 5) Warehouse
- `purchase_orders` -> PO vendor
- `inbound_deliveries` + `inbound_items` -> penerimaan barang
- `adjustments` -> koreksi stok
- `stock_balances` -> saldo stok per inventory
- `stock_movements` -> histori mutasi stok
- `returns` -> retur ke vendor
- `master_vendor` -> vendor

### 6) Payout
- `t_payout` -> payout settlement (link ke order via `ref_no`)
- `t_adjustments` -> adjustment payout
- `payout_transfers` -> transfer payout ke rekening internal
- Relasi utama:
  - `t_payout.ref -> sales.t_order.ref_no`
  - `t_adjustments.ref -> sales.t_order.ref_no`
  - `payout_transfers.payout_id -> t_payout.payout_id`

### 7) Accounting
- `accounts` -> chart of accounts (mendukung parent-child)
- `account_categories` -> kategori akun
- `journal_entries` + `journal_lines` -> header/detail jurnal
- `operational_expenses` -> biaya operasional
- Relasi utama:
  - `journal_lines.journal_entry_id -> journal_entries.id`
  - `journal_lines.account_id -> accounts.id`
  - `operational_expenses.expense_account_id/payment_account_id -> accounts.id`

## Relasi Lintas Domain yang Penting

- `sales.t_order.ref_no` menjadi penghubung utama ke domain `payout`.
- `channel.m_channel` menghubungkan `sales` dengan `accounting` (mapping akun channel).
- `product.master_inventory` menjadi pusat referensi untuk `warehouse` dan sebagian `accounting` (operational expense).

## Prinsip Model Data Saat Ini

- Kunci bisnis dan kunci teknis dibedakan:
  - bisnis: `order_no`, `ref_no`, `payout_id`
  - teknis: UUID/int untuk relasi internal
- Penamaan tabel legacy dipertahankan (`t_*`, `m_*`) demi kompatibilitas data existing.
- Banyak tabel memakai index di foreign key dan reference field untuk query operasional.

## Alur Data Tingkat Tinggi

1. Master data disiapkan (`channel`, `product`, `warehouse`, `customer`).
2. Transaksi masuk di `sales` (`t_order`, `t_order_item`).
3. Payout marketplace masuk ke `payout` via `ref_no`.
4. Mutasi stok dicatat di `warehouse.stock_movements` dan saldo di `stock_balances`.
5. Dampak finansial dicatat ke `accounting.journal_entries` + `journal_lines`.
   Catatan sementara:
   - jurnal `sales` sedang di-hold
   - jurnal `payout`, `payout adjustment`, `payout transfer`, dan `opex` tetap aktif

## Referensi Lanjutan

- Skema lengkap: `prisma/schema.prisma`
- Standar reference key: `docs/reference-system-standard.md`
- Klasifikasi master vs transaksi dan channel `SALDO` vs `DIRECT`: `docs/data-classification-and-channel-settlement.md`

## Detail DDL (Ringkas per Tabel Inti)

Catatan:
- Tipe mengikuti PostgreSQL.
- Ini ringkasan tabel paling krusial untuk operasional.
- Untuk DDL penuh semua tabel, pakai perintah di bagian paling bawah.

## Daftar Tabel Lengkap (Coverage 29/29)

### accounting (5)
- `accounting.account_categories`
- `accounting.accounts`
- `accounting.journal_entries`
- `accounting.journal_lines`
- `accounting.operational_expenses`

### auth (2)
- `auth.roles`
- `auth.users`

### channel (3)
- `channel.m_channel_group`
- `channel.m_channel_category`
- `channel.m_channel`

### payout (3)
- `payout.t_payout`
- `payout.t_adjustments`
- `payout.payout_transfers`

### product (5)
- `product.category_product`
- `product.master_inventory`
- `product.master_product`
- `product.product_bom`
- `product.hpp_history`

### sales (3)
- `sales.master_customer`
- `sales.t_order`
- `sales.t_order_item`

### warehouse (8)
- `warehouse.master_vendor`
- `warehouse.purchase_orders`
- `warehouse.inbound_deliveries`
- `warehouse.inbound_items`
- `warehouse.returns`
- `warehouse.adjustments`
- `warehouse.stock_balances`
- `warehouse.stock_movements`

## DDL Tambahan (Yang Sebelumnya Belum Tercantum)

### product.category_product (Kategori Produk)

```sql
CREATE TABLE product.category_product (
  category_code        VARCHAR(50) PRIMARY KEY,
  parent_category_code VARCHAR(50),
  category_name        VARCHAR(150) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT fk_category_product_parent
    FOREIGN KEY (parent_category_code)
    REFERENCES product.category_product(category_code) ON DELETE RESTRICT
);
```

### channel.m_channel_group

```sql
CREATE TABLE channel.m_channel_group (
  group_id    SERIAL PRIMARY KEY,
  group_name  VARCHAR(50) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### channel.m_channel_category

```sql
CREATE TABLE channel.m_channel_category (
  category_id    SERIAL PRIMARY KEY,
  group_id       INT,
  category_name  VARCHAR(50) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_channel_category_group_id
    FOREIGN KEY (group_id) REFERENCES channel.m_channel_group(group_id) ON DELETE RESTRICT
);
```

### channel.m_channel

```sql
CREATE TABLE channel.m_channel (
  channel_id          SERIAL PRIMARY KEY,
  category_id         INT,
  piutang_account_id  UUID,
  revenue_account_id  UUID,
  saldo_account_id    UUID,
  channel_name        VARCHAR(100) NOT NULL,
  slug                VARCHAR(100) UNIQUE,
  is_marketplace      BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ,
  CONSTRAINT fk_channel_channel_category_id
    FOREIGN KEY (category_id) REFERENCES channel.m_channel_category(category_id) ON DELETE RESTRICT
);
CREATE INDEX idx_channel_m_channel_category_id ON channel.m_channel(category_id);
```

### payout.t_adjustments

```sql
CREATE TABLE payout.t_adjustments (
  adjustment_id    SERIAL PRIMARY KEY,
  ref              VARCHAR(100),
  payout_date      DATE NOT NULL,
  adjustment_date  DATE,
  channel_id       INT,
  adjustment_type  VARCHAR(100),
  reason           TEXT,
  amount           NUMERIC(18,2) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_t_adjustments_ref
    FOREIGN KEY (ref) REFERENCES sales.t_order(ref_no) ON DELETE RESTRICT,
  CONSTRAINT fk_t_adjustments_channel_id
    FOREIGN KEY (channel_id) REFERENCES channel.m_channel(channel_id) ON DELETE RESTRICT
);
CREATE INDEX idx_payout_t_adjustments_ref ON payout.t_adjustments(ref);
```

### sales.master_customer

```sql
CREATE TABLE sales.master_customer (
  customer_id    SERIAL PRIMARY KEY,
  customer_name  VARCHAR(255) NOT NULL,
  phone          VARCHAR(50),
  email          VARCHAR(255),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### warehouse.master_vendor

```sql
CREATE TABLE warehouse.master_vendor (
  vendor_code  VARCHAR(100) PRIMARY KEY,
  vendor_name  VARCHAR(255) NOT NULL,
  pic_name     VARCHAR(100),
  phone        VARCHAR(50),
  address      TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ
);
```

### warehouse.purchase_orders

```sql
CREATE TABLE warehouse.purchase_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number   VARCHAR(50) UNIQUE NOT NULL,
  vendor_code VARCHAR(100) NOT NULL,
  order_date  DATE NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ,
  CONSTRAINT fk_purchase_orders_vendor_code
    FOREIGN KEY (vendor_code) REFERENCES warehouse.master_vendor(vendor_code)
);
CREATE INDEX idx_warehouse_purchase_orders_vendor_code
  ON warehouse.purchase_orders(vendor_code);
```

### warehouse.inbound_deliveries + inbound_items

```sql
CREATE TABLE warehouse.inbound_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id               UUID,
  receive_date        DATE NOT NULL,
  surat_jalan_vendor  VARCHAR(100),
  qc_status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  received_by         VARCHAR(100) NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_inbound_deliveries_po_id
    FOREIGN KEY (po_id) REFERENCES warehouse.purchase_orders(id) ON DELETE RESTRICT
);
CREATE INDEX idx_warehouse_inbound_deliveries_po_id
  ON warehouse.inbound_deliveries(po_id);

CREATE TABLE warehouse.inbound_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbound_id      UUID NOT NULL,
  inv_code        VARCHAR(100) NOT NULL,
  qty_received    INT NOT NULL DEFAULT 0,
  qty_passed_qc   INT NOT NULL DEFAULT 0,
  qty_rejected_qc INT NOT NULL DEFAULT 0,
  unit_cost       NUMERIC(18,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_inbound_items_inbound_id
    FOREIGN KEY (inbound_id) REFERENCES warehouse.inbound_deliveries(id),
  CONSTRAINT fk_inbound_items_inv_code
    FOREIGN KEY (inv_code) REFERENCES product.master_inventory(inv_code)
);
CREATE INDEX idx_warehouse_inbound_items_inbound_id ON warehouse.inbound_items(inbound_id);
CREATE INDEX idx_warehouse_inbound_items_inv_code ON warehouse.inbound_items(inv_code);
```

## DDL Signature Semua Tabel (PK/FK Cepat)

| Schema | Tabel | PK | FK Utama |
| --- | --- | --- | --- |
| accounting | account_categories | `id` | - |
| accounting | accounts | `id` | `category_id -> account_categories.id`, `parent_id -> accounts.id` |
| accounting | journal_entries | `id` | - |
| accounting | journal_lines | `id` | `journal_entry_id -> journal_entries.id`, `account_id -> accounts.id` |
| accounting | operational_expenses | `id` | `expense_account_id -> accounts.id`, `payment_account_id -> accounts.id`, `inv_code -> product.master_inventory.inv_code` |
| auth | roles | `id` | - |
| auth | users | `id` | `role_id -> roles.id` |
| channel | m_channel_group | `group_id` | - |
| channel | m_channel_category | `category_id` | `group_id -> m_channel_group.group_id` |
| channel | m_channel | `channel_id` | `category_id -> m_channel_category.category_id`, account mapping -> `accounting.accounts.id` |
| payout | t_payout | `payout_id` | `ref -> sales.t_order.ref_no` |
| payout | t_adjustments | `adjustment_id` | `ref -> sales.t_order.ref_no`, `channel_id -> channel.m_channel.channel_id` |
| payout | payout_transfers | `id` | `payout_id -> t_payout.payout_id`, `bank_account_id -> accounting.accounts.id` |
| product | category_product | `category_code` | `parent_category_code -> category_product.category_code` |
| product | master_inventory | `inv_code` | - |
| product | master_product | `sku` | `category_code -> category_product.category_code`, `inv_main/inv_acc -> master_inventory.inv_code` |
| product | product_bom | `id` | `sku -> master_product.sku`, `inv_code -> master_inventory.inv_code` |
| product | hpp_history | `id` | `sku -> master_product.sku` |
| sales | master_customer | `customer_id` | - |
| sales | t_order | `order_no` | `parent_order_no -> t_order.order_no`, `customer_id -> master_customer.customer_id`, `channel_id -> channel.m_channel.channel_id` |
| sales | t_order_item | `id` | `order_no -> t_order.order_no`, `sku -> product.master_product.sku` |
| warehouse | master_vendor | `vendor_code` | - |
| warehouse | purchase_orders | `id` | `vendor_code -> master_vendor.vendor_code` |
| warehouse | inbound_deliveries | `id` | `po_id -> purchase_orders.id` |
| warehouse | inbound_items | `id` | `inbound_id -> inbound_deliveries.id`, `inv_code -> product.master_inventory.inv_code` |
| warehouse | returns | `id` | `inbound_id -> inbound_deliveries.id`, `inv_code -> product.master_inventory.inv_code` |
| warehouse | adjustments | `id` | `inv_code -> product.master_inventory.inv_code` |
| warehouse | stock_balances | `inv_code` | `inv_code -> product.master_inventory.inv_code` |
| warehouse | stock_movements | `id` | `inv_code -> product.master_inventory.inv_code` |

### auth.roles

```sql
CREATE TABLE auth.roles (
  id          SERIAL PRIMARY KEY,
  role_name   VARCHAR(100) UNIQUE NOT NULL,
  permissions JSON NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### auth.users

```sql
CREATE TABLE auth.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       INT NULL,
  username      VARCHAR(100) UNIQUE NOT NULL,
  full_name     VARCHAR(150),
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT fk_auth_users_role_id
    FOREIGN KEY (role_id) REFERENCES auth.roles(id) ON DELETE RESTRICT
);
CREATE INDEX idx_auth_users_role_id ON auth.users(role_id);
```

### sales.t_order

```sql
CREATE TABLE sales.t_order (
  order_no        VARCHAR(50) PRIMARY KEY,
  order_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ref_no          VARCHAR(100) UNIQUE,
  parent_order_no VARCHAR(50),
  channel_id      INT,
  customer_id     INT,
  total_amount    NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  status          VARCHAR(50) NOT NULL DEFAULT 'PICKUP',
  is_historical   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_t_order_parent_order_no
    FOREIGN KEY (parent_order_no) REFERENCES sales.t_order(order_no) ON DELETE RESTRICT,
  CONSTRAINT fk_t_order_channel_id
    FOREIGN KEY (channel_id) REFERENCES channel.m_channel(channel_id) ON DELETE RESTRICT,
  CONSTRAINT fk_t_order_customer_id
    FOREIGN KEY (customer_id) REFERENCES sales.master_customer(customer_id) ON DELETE RESTRICT
);
CREATE INDEX idx_sales_t_order_channel_id ON sales.t_order(channel_id);
CREATE INDEX idx_sales_t_order_customer_id ON sales.t_order(customer_id);
CREATE INDEX idx_sales_t_order_ref_no ON sales.t_order(ref_no);
```

### sales.t_order_item

```sql
CREATE TABLE sales.t_order_item (
  id            SERIAL PRIMARY KEY,
  order_no      VARCHAR(50),
  sku           VARCHAR(100),
  qty           INT NOT NULL,
  unit_price    NUMERIC(18,2) NOT NULL,
  discount_item NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_t_order_item_order_no
    FOREIGN KEY (order_no) REFERENCES sales.t_order(order_no) ON DELETE RESTRICT,
  CONSTRAINT fk_t_order_item_sku
    FOREIGN KEY (sku) REFERENCES product.master_product(sku) ON DELETE RESTRICT
);
CREATE INDEX idx_sales_t_order_item_order_no ON sales.t_order_item(order_no);
CREATE INDEX idx_sales_t_order_item_sku ON sales.t_order_item(sku);
```

### payout.t_payout

```sql
CREATE TABLE payout.t_payout (
  payout_id         SERIAL PRIMARY KEY,
  ref               VARCHAR(100) UNIQUE,
  payout_date       DATE NOT NULL,
  qty_produk        INT NOT NULL DEFAULT 0,
  hpp               NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  total_price       NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  seller_discount   NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  fee_admin         NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  fee_service       NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  fee_order_process NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  fee_program       NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  fee_transaction   NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  fee_affiliate     NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  shipping_cost     NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  omset             NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  payout_status     VARCHAR(20),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_t_payout_ref
    FOREIGN KEY (ref) REFERENCES sales.t_order(ref_no) ON DELETE RESTRICT
);
```

### product.master_inventory

```sql
CREATE TABLE product.master_inventory (
  inv_code     VARCHAR(100) PRIMARY KEY,
  inv_name     VARCHAR(255) NOT NULL,
  description  TEXT,
  hpp          NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT true
);
```

### product.master_product

```sql
CREATE TABLE product.master_product (
  sku           VARCHAR(100) PRIMARY KEY,
  category_code VARCHAR(50),
  sku_name      VARCHAR(255) NOT NULL,
  product_name  VARCHAR(255) NOT NULL,
  inv_main      VARCHAR(100),
  inv_acc       VARCHAR(100),
  is_bundling   BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  total_hpp     NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ,
  CONSTRAINT fk_master_product_category
    FOREIGN KEY (category_code) REFERENCES product.category_product(category_code) ON DELETE RESTRICT,
  CONSTRAINT fk_master_product_inv_main
    FOREIGN KEY (inv_main) REFERENCES product.master_inventory(inv_code) ON DELETE RESTRICT,
  CONSTRAINT fk_master_product_inv_acc
    FOREIGN KEY (inv_acc) REFERENCES product.master_inventory(inv_code) ON DELETE RESTRICT
);
CREATE INDEX idx_product_master_product_category_code ON product.master_product(category_code);
CREATE INDEX idx_product_master_product_inv_main ON product.master_product(inv_main);
CREATE INDEX idx_product_master_product_inv_acc ON product.master_product(inv_acc);
```

Catatan implementasi:
- Struktur target aplikasi mengikuti DDL di atas (tanpa `price_mp` dan `price_non_mp`).
- Jika database existing masih memiliki dua kolom tersebut, lakukan cleanup DDL dengan user owner tabel:

```sql
ALTER TABLE product.master_product
  DROP COLUMN IF EXISTS price_mp,
  DROP COLUMN IF EXISTS price_non_mp;
```

### warehouse.stock_movements

```sql
CREATE TABLE warehouse.stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
  inv_code        VARCHAR(100) NOT NULL,
  reference_type  VARCHAR(50) NOT NULL,
  reference_id    VARCHAR(100) NOT NULL,
  qty_change      INT NOT NULL,
  running_balance INT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_stock_movements_inv_code
    FOREIGN KEY (inv_code) REFERENCES product.master_inventory(inv_code)
);
CREATE INDEX idx_warehouse_stock_movements_inv_code
  ON warehouse.stock_movements(inv_code);
CREATE INDEX idx_warehouse_stock_movements_reference
  ON warehouse.stock_movements(reference_type, reference_id);
```

### warehouse.adjustments

```sql
CREATE TABLE warehouse.adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_date DATE NOT NULL,
  inv_code        VARCHAR(100) NOT NULL,
  adj_type        VARCHAR(10) NOT NULL,
  post_status     VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  posted_at       TIMESTAMPTZ,
  qty             INT NOT NULL,
  reason          TEXT NOT NULL,
  notes           TEXT,
  created_by     VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_adjustments_inv_code
    FOREIGN KEY (inv_code) REFERENCES product.master_inventory(inv_code) ON DELETE RESTRICT,
  CONSTRAINT chk_adjustments_adj_type
    CHECK (adj_type IN ('IN', 'OUT')),
  CONSTRAINT chk_adjustments_reason
    CHECK (reason IN (
      'Loss',
      'Surplus',
      'Rijek',
      'Event Masuk',
      'Event Keluar',
      'Konsinyasi Masuk',
      'Konsinyasi Keluar',
      'Inventaris Konten',
      'Sampel Produk',
      'Display',
      'Tukar Produk'
    ))
);
CREATE INDEX idx_warehouse_adjustments_inv_code
  ON warehouse.adjustments(inv_code);
CREATE INDEX idx_warehouse_adjustments_adjustment_date
  ON warehouse.adjustments(adjustment_date);
```

Catatan implementasi:
- Validasi enum `adj_type` dan `reason` saat ini ditegakkan di level aplikasi (`zod schema` / API).
- DB di atas menampilkan bentuk constraint yang disarankan agar konsisten dengan aplikasi.

### accounting.accounts

```sql
CREATE TABLE accounting.accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    INT,
  parent_id      UUID,
  code           VARCHAR(50) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  normal_balance VARCHAR(20) NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ,
  CONSTRAINT fk_accounts_category_id
    FOREIGN KEY (category_id) REFERENCES accounting.account_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_accounts_parent_id
    FOREIGN KEY (parent_id) REFERENCES accounting.accounts(id) ON DELETE RESTRICT
);
CREATE INDEX idx_accounting_accounts_category_id ON accounting.accounts(category_id);
CREATE INDEX idx_accounting_accounts_parent_id ON accounting.accounts(parent_id);
```

### accounting.journal_entries + journal_lines

```sql
CREATE TABLE accounting.journal_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  reference_type   VARCHAR(50) NOT NULL,
  reference_id     UUID,
  description      TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ
);
CREATE INDEX idx_accounting_journal_entries_reference_type
  ON accounting.journal_entries(reference_type);

CREATE TABLE accounting.journal_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL,
  account_id       UUID NOT NULL,
  debit            NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  credit           NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  memo             VARCHAR(255),
  CONSTRAINT fk_journal_lines_journal_entry_id
    FOREIGN KEY (journal_entry_id) REFERENCES accounting.journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_journal_lines_account_id
    FOREIGN KEY (account_id) REFERENCES accounting.accounts(id)
);
CREATE INDEX idx_accounting_journal_lines_journal_entry_id
  ON accounting.journal_lines(journal_entry_id);
CREATE INDEX idx_accounting_journal_lines_account_id
  ON accounting.journal_lines(account_id);
```

## Ambil DDL Lengkap (Semua Tabel)

Jika butuh full DDL aktual dari environment:

```bash
pg_dump "$DATABASE_URL" -s -n auth -n channel -n sales -n product -n warehouse -n payout -n accounting > full-schema.sql
```

Atau per schema:

```bash
pg_dump "$DATABASE_URL" -s -n sales > sales-schema.sql
```
