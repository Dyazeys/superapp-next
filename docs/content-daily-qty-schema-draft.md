# Content Daily Qty Schema Draft

Tanggal update: `2026-04-28`

Dokumen ini menyimpan draft rekomendasi schema awal untuk modul `Konten`, dengan fokus utama pada input `qty konten harian`.

## Tujuan

- Menyediakan struktur data sederhana untuk input qty konten per hari.
- Tetap cukup fleksibel untuk dipakai di TikTok dan Instagram.
- Menjaga schema tetap rapi kalau nanti modul berkembang ke performa konten, kalender konten, atau evaluasi campaign.

## Prinsip Desain

- Jangan pisahkan tabel harian per platform seperti `tiktok_daily` dan `instagram_daily`.
- Gunakan satu domain `content` yang generik.
- Pisahkan master platform, master account, dan transaksi harian.
- Simpan data harian sebagai `header + items` supaya satu akun per hari bisa punya banyak jenis konten.

## Rekomendasi Struktur

### 1. `content.m_content_platform`

Master platform konten.

Kolom utama:
- `platform_id` `smallint` PK
- `platform_code` `varchar(20)` unique
- `platform_name` `varchar(50)`
- `created_at`

Seed awal:
- `TIKTOK`
- `INSTAGRAM`

### 2. `content.m_content_account`

Master akun atau profile konten.

Kolom utama:
- `account_id` `uuid` PK
- `platform_id` FK ke `content.m_content_platform`
- `channel_id` `int` nullable FK ke `channel.m_channel`
- `account_name` `varchar(100)`
- `handle` `varchar(100)`
- `is_active` `boolean`
- `created_at`
- `updated_at`

Catatan:
- `channel_id` dibuat nullable karena tidak semua akun konten harus langsung terikat ke channel transaksi.
- Tabel ini penting kalau nanti ada lebih dari satu akun TikTok atau Instagram.

### 3. `content.m_content_type`

Master jenis konten.

Kolom utama:
- `content_type_id` `smallint` PK
- `platform_id` nullable FK ke `content.m_content_platform`
- `type_code` `varchar(30)` unique
- `type_name` `varchar(50)`
- `sort_order` `int`
- `is_active` `boolean`

Contoh data:
- `VIDEO`
- `REELS`
- `STORY`
- `FEED`
- `CAROUSEL`
- `LIVE`

Catatan:
- `platform_id` boleh nullable kalau tipe konten dipakai lintas platform.
- Kalau ada tipe khusus platform, baru isi `platform_id`.

### 4. `content.daily_content_report`

Header input harian per akun.

Kolom utama:
- `report_id` `uuid` PK
- `report_date` `date`
- `account_id` FK ke `content.m_content_account`
- `notes` `text` nullable
- `created_by` `uuid` FK ke `auth.users`
- `created_at`
- `updated_at`

Constraint:
- unique `(report_date, account_id)`

Catatan:
- Satu akun hanya punya satu header report per tanggal.
- Cocok untuk UI input harian yang dibuka per akun.

### 5. `content.daily_content_report_item`

Detail qty per jenis konten dalam satu hari.

Kolom utama:
- `item_id` `uuid` PK
- `report_id` FK ke `content.daily_content_report`
- `content_type_id` FK ke `content.m_content_type`
- `qty_idea` `int default 0`
- `qty_script` `int default 0`
- `qty_shoot` `int default 0`
- `qty_edit` `int default 0`
- `qty_posted` `int default 0`
- `qty_boosted` `int default 0`
- `notes` `varchar(255)` nullable
- `created_at`
- `updated_at`

Constraint:
- unique `(report_id, content_type_id)`

Catatan:
- Model ini cocok kalau tim ingin memonitor progress produksi sekaligus hasil posting.
- Kalau dirasa terlalu detail untuk MVP, beberapa kolom qty bisa disederhanakan.

## Rekomendasi MVP

Kalau target awal hanya input qty harian dan ingin implementasi cepat, struktur paling seimbang adalah:

- `content.m_content_account`
- `content.m_content_type`
- `content.daily_content_report`
- `content.daily_content_report_item`

Alasannya:
- tidak terlalu berat
- sudah mendukung multi-platform
- sudah rapi untuk input model tabel
- masih mudah dikembangkan nanti

## Opsi MVP Lebih Sederhana

Kalau ingin benar-benar minimal, bisa pakai satu tabel transaksi tunggal:

### `content.daily_content_qty`

Kolom utama:
- `id` `uuid` PK
- `content_date` `date`
- `account_id` FK
- `content_type_id` FK
- `qty_draft` `int default 0`
- `qty_posted` `int default 0`
- `qty_live_session` `int default 0`
- `notes` `varchar(255)` nullable
- `created_by` `uuid` FK ke `auth.users`
- `created_at`
- `updated_at`

Constraint:
- unique `(content_date, account_id, content_type_id)`

Catatan:
- versi ini cepat dibuat
- tapi akan lebih cepat mentok saat kebutuhan bertambah

## Saran UI Tabel Input Harian

Kalau dipakai di form tabel harian, bentuknya bisa seperti ini:

- header filter: `tanggal`, `platform`, `account`
- rows: jenis konten seperti `Video`, `Reels`, `Story`, `Feed`
- columns qty:
  - `Idea`
  - `Script`
  - `Shoot`
  - `Edit`
  - `Posted`
  - `Boosted`
- kolom terakhir: `Notes`

Kalau mau lebih simpel untuk awal:
- rows: jenis konten
- columns:
  - `Target`
  - `Actual Posted`
  - `Notes`

## Rekomendasi Implementasi Lanjutan

Urutan implementasi yang disarankan:

1. buat schema `content`
2. buat master `platform`, `account`, dan `content_type`
3. buat transaksi `daily_content_report` dan `daily_content_report_item`
4. buat form input tabel harian
5. baru tambahkan dashboard recap harian/mingguan/bulanan

## Catatan untuk Nanti Malam

Saat lanjut implementasi auth dan role, modul `Konten` kemungkinan perlu akses minimal:

- `content.view`
- `content.create`
- `content.update`
- `content.approve` jika nanti ada workflow approval

Role ini belum diikat di schema draft ini, tapi sudah perlu diingat supaya desain auth tidak bolak-balik.
