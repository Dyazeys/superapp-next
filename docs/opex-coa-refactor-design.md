# Opex COA Refactor Design

Tanggal update: `2026-04-28`

Dokumen ini merangkum desain target dan urutan implementasi untuk refactor besar akun `Marketing` dan `Operasional` di modul opex.

Status saat draft ini dibuat:
- tabel `accounting.operational_expenses` masih `0` record
- ini berarti refactor bisa dilakukan tanpa beban migrasi histori transaksi nyata

Status terbaru:
- backup akun kode `6xxxx` sudah dibuat di `docs/reports/accounting-code6-backup-20260428-103118.sql`
- master account `6xxxx` sudah direfresh di database
- akun payout settlement `61114` s.d. `61120` tetap dipertahankan aktif
- field `expense_label` sudah ditambahkan ke tabel `accounting.operational_expenses`
- schema validasi opex sudah ditambahkan di `schemas/accounting-module.ts`
- template CSV kosong opex sudah diselaraskan agar ikut membawa `expense_label`
- endpoint opex sudah tersedia di `/api/accounting/operational-expenses`
- jurnal `OPERATIONAL_EXPENSE` sudah ikut sinkron saat create/update/delete opex
- smoke test HTTP opex manual + jurnal sudah lolos, dan data test sudah dibersihkan kembali
- script smoke test opex manual sekarang tersedia di `npm run opex:smoke`
- workspace UI opex sudah tersedia di `/accounting/operational-expenses`
- form UI opex manual sudah membedakan `marketing` vs `operasional`, mendukung `expense_label`, dan hanya menerima pembayaran via kas/bank
- toggle barter sudah dikeluarkan dari page opex biasa
- modul barter multi-item awal sudah tersedia di `/accounting/operational-expense-barter`
- report barter awal sudah tersedia di `/accounting/operational-expense-barter-report`
- tabel `accounting.operational_expense_barter` dan `accounting.operational_expense_barter_items` sudah dibuat
- sync barter ke `warehouse.stock_movements` dan `accounting.journal_entries` sudah aktif
- smoke test barter multi-item tersedia di `npm run opex:barter:smoke` dan sudah lolos
- transaksi opex nyata masih `0`, jadi fase schema/UI/API masih aman dikerjakan tanpa migrasi data transaksi

## 0) Snapshot Implementasi Saat Ini

Struktur akun `6xxxx` yang saat ini sudah aktif di database:

### Marketing

- `60000` `Beban Marketing & Operasional`
- `61000` `Beban Marketing`
- `61101` `Iklan MP`
- `61102` `KOL Tukar Produk`
- `61103` `Sponsorship`
- `61104` `Event`

### Payout Settlement Expense Yang Tetap Aktif

- `61114` `Admin Fee Marketplace`
- `61115` `Service Fee Marketplace`
- `61116` `Order Process Fee Marketplace`
- `61117` `Program Fee Marketplace`
- `61118` `Affiliate Commission Marketplace`
- `61119` `Shipping Cost Shopee`
- `61120` `Shipping Cost Tokopedia-Tiktokshop`

### Operasional

- `62000` `Beban Operasional`
- `62101` `Gaji & Insentif`
- `62102` `Listrik & Internet`
- `62103` `Operasional CC`
- `62104` `Kendaraan`
- `62105` `Konsumsi & ATK`
- `62106` `Entertain`
- `62107` `Pengembangan SDM`
- `62108` `Ongkir`
- `62109` `R&D`
- `62110` `Gedung`
- `62111` `Maintenance Inventaris Kantor`

Slot cadangan saat ini:

- `61105` s.d. `61113` = `Reserved Marketing 01` s.d. `Reserved Marketing 09` (`inactive`)
- `62112` s.d. `62116` = `Reserved Operasional 01` s.d. `Reserved Operasional 05` (`inactive`)

## 1) Tujuan

- Memisahkan tegas akun `Marketing` dan `Operasional`.
- Menjaga struktur COA tetap rapi dan tidak meledak terlalu detail.
- Menyediakan detail reporting sampai level sub-subkategori tanpa memaksa semua detail menjadi akun.
- Menjadikan struktur akun lebih dekat dengan template laporan bisnis yang dipakai owner.

## 2) Prinsip Desain

- `61xxx` dipakai untuk `Marketing`.
- `62xxx` dipakai untuk `Operasional`.
- Yang dijadikan akun hanya level submenu besar.
- Level sub-submenu tidak dijadikan akun dulu.
- Level sub-submenu tetap disimpan sebagai label transaksi untuk kebutuhan reporting dan filter.

## 3) Implikasi Model Data

Struktur saat ini di `accounting.operational_expenses` baru punya:
- `expense_account_id`
- `payment_account_id`
- `description`
- `amount`
- `qty`
- `inv_code`

Itu belum cukup untuk menyimpan detail subkategori bisnis secara rapi.

### Saran Perubahan Schema

Tambahkan field baru di `accounting.operational_expenses`:

- `expense_group`
  - contoh: `Marketing`, `Operasional`
- `expense_label`
  - contoh: `Gaji`, `Insentif`, `Wifi`, `Server`, `BBM`

Catatan:
- `expense_group` bisa juga dianggap derived dari akun parent, jadi opsional
- field yang paling penting sebenarnya `expense_label`
- kalau ingin lebih eksplisit, nama yang aman adalah `expense_subcategory`

## 4) Struktur COA Target

### 4.1 Marketing

Parent:
- `61000` `Beban Marketing`

Akun leaf target:
- `61101` `Iklan MP`
- `61102` `KOL Tukar Produk`
- `61103` `Sponsorship`
- `61104` `Event`

Catatan:
- akun marketplace payout seperti `61114` s.d. `61120` tetap bagian dari domain payout settlement
- jangan dicampur ke opex manual harian

### 4.2 Operasional

Parent:
- `62000` `Beban Operasional`

Akun leaf target:
- `62101` `Gaji & Insentif`
- `62102` `Listrik & Internet`
- `62103` `Operasional CC`
- `62104` `Kendaraan`
- `62105` `Konsumsi & ATK`
- `62106` `Entertain`
- `62107` `Pengembangan SDM`
- `62108` `Ongkir`
- `62109` `R&D`
- `62110` `Gedung`
- `62111` `Maintenance Inventaris Kantor`

## 5) Label Detail per Akun

Label ini tidak perlu dijadikan akun dulu. Cukup jadi pilihan input / label reporting.

### 5.1 Marketing

| Akun | Label detail |
|---|---|
| `Iklan MP` | `Iklan MP` |
| `KOL Tukar Produk` | `KOL Tukar Produk` |
| `Sponsorship` | `Sponsorship` |
| `Event` | `Event` |

### 5.2 Operasional

| Akun | Label detail |
|---|---|
| `Gaji & Insentif` | `Gaji`, `Insentif` |
| `Listrik & Internet` | `Listrik`, `Wifi`, `Kuota`, `Server`, `Air` |
| `Operasional CC` | `BBM`, `Tools Berlangganan`, `Konsumsi CC` |
| `Kendaraan` | `Service & Maintenance`, `Pajak Kendaraan` |
| `Konsumsi & ATK` | `Stok`, `Acara` |
| `Entertain` | `Dinas Luar`, `Tamu`, `Keamanan/Sumbangan`, `Bensin` |
| `Pengembangan SDM` | `Kajian Rutin`, `Workshop` |
| `Ongkir` | `Ongkir pengiriman (non MP & Reseller)` |
| `R&D` | `Sampling`, `dll` |
| `Gedung` | `Maintenance`, `dll` |
| `Maintenance Inventaris Kantor` | `Service`, `Beli part` |

## 6) Mapping Existing ke Target

Karena transaksi opex nyata masih kosong, fokus mapping adalah struktur master akun, bukan histori transaksi.

### 6.1 Existing Marketing

| Existing | Status | Target |
|---|---|---|
| `61000` `Beban Pemasaran` | rename | `Beban Marketing` |
| `61101` `Biaya Iklan` | repurpose | `Iklan MP` |
| `61102` `CRM` | repurpose | `KOL Tukar Produk` |
| `61103` `Biaya Produksi Konten` | repurpose | `Sponsorship` |
| `61105` `Biaya Event` | repurpose | `Event` |

### 6.2 Existing Operasional

| Existing | Status | Target |
|---|---|---|
| `62000` `Beban Operasional` | keep | `Beban Operasional` |
| `62101` `Beban Listrik` | repurpose | `Gaji & Insentif` |
| `62102` `Beban Internet` | repurpose | `Listrik & Internet` |
| `62103` `Beban Air` | repurpose | `Operasional CC` |
| `62104` `Beban Peralatan & Perlengkapan` | repurpose | `Kendaraan` |
| `62105` `Beban Kebersihan / Perawatan` | repurpose | `Konsumsi & ATK` |
| `62106` `Beban Catering` | repurpose | `Entertain` |
| `62107` `Beban Pengembangan SDM` | keep/rename ringan | `Pengembangan SDM` |
| `62108` `Beban Transportasi` | repurpose | `Ongkir` |
| `62109` `Ongkir Barang Datang` | repurpose | `R&D` |
| `62110` `Ongkir Pengiriman` | repurpose | `Gedung` |
| `62111` `Dll` | repurpose | `Maintenance Inventaris Kantor` |

### 6.3 Existing yang Sebaiknya Di-hold / Review

| Existing | Saran |
|---|---|
| `61104` `Biaya Endorsment` | review apakah masuk `Sponsorship` atau tetap akun tersendiri |
| `61106` `Biaya Sampel Produk` | review apakah pindah ke `R&D` |
| `62112` `Biaya Penyusutan Aset` | jangan digabung ke template ini dulu; biarkan akun khusus |
| `62113` `Maintenance - Konten Kreator` | review apakah pindah ke Marketing atau tetap operasional |
| `62114` `Maintenance - Digital Marketing` | review apakah pindah ke Marketing atau tetap operasional |
| `62115` `Beban Gaji Karyawan` | merge ke `Gaji & Insentif` |
| `62116` `Beban Komisi` | review apakah jadi label di `Gaji & Insentif` atau akun terpisah |

## 7) Desain UI / API Target

### Form Input Opex

User nantinya memilih:

1. `group`
   - `Marketing`
   - `Operasional`
2. `expense_account_id`
   - akun leaf sesuai group
3. `expense_label`
   - label detail di bawah akun leaf
4. `payment_account_id`
5. `amount`
6. `description`

### Behavior

- `expense_label` wajib dipilih dari daftar yang sesuai akun leaf.
- `description` tetap dipakai untuk catatan bebas.
- `expense_label` dipakai untuk reporting detail.

## 7A) Keputusan Baru: Barter Dipisah dari Opex Biasa

Keputusan terbaru:

- `Opex` biasa tetap difokuskan untuk transaksi pengeluaran kas / bank.
- `Barter / Tukar Produk` tidak lagi dianggap variasi kecil dari form opex biasa.
- Alasan utamanya: satu transaksi barter bisa berisi lebih dari satu barang, mengurangi stok, dan membawa nilai per item.

Implikasi desain:

- `accounting.operational_expenses` diposisikan untuk opex manual biasa:
  - 1 transaksi
  - 1 akun beban
  - 1 sumber pembayaran
  - 1 nominal total
- barter multi-item diarahkan menjadi submodule terpisah dengan pola:
  - header transaksi
  - detail item barang
  - qty per item
  - nilai per item
  - total transaksi dari akumulasi item

Analogi yang paling dekat:

- barter lebih mirip `order` + `order_items`
- bukan sekadar 1 row opex dengan `inv_code` tunggal

## 7B) Konsekuensi ke Model Data

Desain target yang lebih sehat untuk barter:

- tabel header, misalnya `accounting.operational_expense_barter`
- tabel detail, misalnya `accounting.operational_expense_barter_items`

Header minimal menyimpan:

- `barter_date`
- `expense_account_id`
- `expense_label`
- `description`
- `total_amount`
- metadata audit standar

Item minimal menyimpan:

- `barter_id`
- `inv_code`
- `qty`
- `unit_amount`
- `line_amount`
- opsional `notes`

Catatan:

- total header sebaiknya dihitung dari item, bukan diinput bebas
- stok berkurang per item, bukan lewat satu kolom `inv_code` di header
- jurnal accounting diposting dari header, tetapi sumber nominal berasal dari akumulasi item

## 7C) Konsekuensi ke UI / API

Target pemisahan modul:

- page `Opex` tetap khusus pengeluaran biasa
- page baru untuk `Opex Barter` atau `Tukar Produk`

Kontrak API target:

- endpoint opex biasa tetap fokus ke pengeluaran kas / bank
- barter punya endpoint sendiri agar validasi tidak bercampur

Contoh arah endpoint:

- `/api/accounting/operational-expenses`
- `/api/accounting/operational-expense-barter`
- `/api/accounting/operational-expense-barter/[id]/items`

Manfaat pemisahan:

- form opex biasa tetap ringan
- validasi barter bisa fokus ke inventory dan item detail
- reporting lebih mudah dipisah antara opex tunai vs opex berbasis inventory

## 7D) Draft Desain Teknis Modul Barter

Bagian ini menjadi blueprint implementasi awal untuk modul barter multi-item.

### Ruang Lingkup

Modul barter dipakai untuk transaksi ketika:

- perusahaan mengeluarkan stok barang
- barang dipakai untuk kebutuhan marketing / operasional
- transaksi tidak dibayar lewat kas / bank
- nilai beban diakui dari total nilai item yang keluar

Contoh kasus:

- kirim beberapa SKU untuk KOL tukar produk
- keluarkan beberapa barang untuk event
- sampling atau pemakaian barang internal yang harus masuk beban

### Entitas Target

Disarankan ada 2 tabel baru:

- `accounting.operational_expense_barter`
- `accounting.operational_expense_barter_items`

#### Header: `accounting.operational_expense_barter`

Field minimum yang disarankan:

- `id`
- `barter_date`
- `expense_account_id`
- `expense_label`
- `description`
- `status`
- `total_amount`
- `created_at`
- `updated_at`

Field opsional yang layak dipertimbangkan:

- `reference_no`
- `notes_internal`
- `posted_at`
- `voided_at`

Status minimum yang disarankan:

- `DRAFT`
- `POSTED`
- `VOID`

Prinsip:

- header menyimpan konteks accounting
- total header dihitung dari item
- jurnal dan stock movement sebaiknya hanya aktif saat status `POSTED`

#### Detail: `accounting.operational_expense_barter_items`

Field minimum yang disarankan:

- `id`
- `barter_id`
- `inv_code`
- `qty`
- `unit_amount`
- `line_amount`
- `notes`
- `created_at`
- `updated_at`

Prinsip:

- satu header bisa punya banyak item
- `line_amount = qty * unit_amount`
- `unit_amount` perlu disimpan sebagai snapshot pada saat posting
- item harus refer ke `product.master_inventory.inv_code`

### Pola Nilai Item

Ada 2 opsi utama untuk valuation item:

1. user input `unit_amount` manual
2. sistem ambil default dari inventory cost lalu user boleh override

Saran awal:

- versi pertama boleh pakai `unit_amount` input manual agar implementasi lebih cepat
- tetapi tetap simpan snapshot nilainya di item
- nanti jika costing inventory sudah stabil, source default bisa diambil dari master inventory / valuation logic

### Alur Posting yang Disarankan

Alur ideal:

1. user buat header barter
2. user isi item satu atau lebih
3. sistem hitung ulang `line_amount` tiap item
4. sistem hitung ulang `total_amount` header
5. saat user `POST`, sistem:
   - validasi header + item
   - buat / sinkron stock movement per item
   - buat / sinkron journal entry accounting
   - ubah status jadi `POSTED`

Saat user `VOID`:

1. sistem hapus / reverse stock movement terkait
2. sistem hapus / reverse journal entry terkait
3. status header jadi `VOID`

### Integrasi Stock Movement

Karena barter mengurangi stok, jejak warehouse harus eksplisit.

Saran pola sinkron:

- setiap item barter membuat 1 row di `warehouse.stock_movements`
- `qty_change` bernilai negatif
- `reference_type` baru, misalnya:
  - `OPERATIONAL_EXPENSE_BARTER`
- `reference_id` mengacu ke `barter_id`
- `notes` membawa konteks akun beban atau deskripsi singkat barter

Catatan penting:

- movement sebaiknya dibuat per item, bukan satu ringkasan per header
- ini memudahkan audit stok dan investigasi mismatch

### Integrasi Jurnal Accounting

Reference type jurnal disarankan dipisah dari opex biasa:

- `OPERATIONAL_EXPENSE_BARTER`

Pola jurnal target per header:

- debit ke `expense_account_id` sebesar `total_amount`
- credit ke akun persediaan default sebesar `total_amount`

Contoh:

- debit `61102 KOL Tukar Produk`
- credit `13101 Persediaan`

Description jurnal sebaiknya memuat:

- nama akun beban
- `expense_label`
- deskripsi transaksi

Memo line sebaiknya memuat:

- line debit: kode akun beban + label
- line credit: informasi bahwa stok keluar untuk barter

Catatan:

- jurnal tetap 1 header accounting per transaksi barter
- detail barang tidak perlu dipecah ke line jurnal per item pada versi pertama
- detail item cukup dijaga di tabel item + stock movement

### Kontrak API yang Disarankan

Target endpoint minimum:

- `GET /api/accounting/operational-expense-barter`
- `POST /api/accounting/operational-expense-barter`
- `GET /api/accounting/operational-expense-barter/[id]`
- `PATCH /api/accounting/operational-expense-barter/[id]`
- `DELETE /api/accounting/operational-expense-barter/[id]`
- `POST /api/accounting/operational-expense-barter/[id]/post`
- `POST /api/accounting/operational-expense-barter/[id]/void`
- `POST /api/accounting/operational-expense-barter/[id]/items`
- `PATCH /api/accounting/operational-expense-barter/[id]/items/[itemId]`
- `DELETE /api/accounting/operational-expense-barter/[id]/items/[itemId]`

Aturan bisnis minimum:

- header tidak boleh `POST` jika item masih kosong
- item tidak boleh punya `qty <= 0`
- item tidak boleh punya `unit_amount < 0`
- `expense_account_id` wajib akun leaf yang memang diizinkan untuk barter
- record `POSTED` tidak boleh diedit bebas; perubahan harus lewat `VOID` lalu buat ulang, atau aturan edit terbatas yang sangat jelas

### Desain UI yang Disarankan

Page baru:

- `/accounting/operational-expense-barter`

Komponen UI minimum:

- tabel daftar transaksi barter
- modal / page detail header
- section item table di dalam detail
- action `Save Draft`, `Post`, `Void`

Field header:

- tanggal barter
- akun beban
- label detail
- deskripsi

Field item:

- inventory
- qty
- unit amount
- line amount
- notes

Ringkasan yang perlu tampil:

- total item count
- total qty
- total amount
- status transaksi

### Rule Audit dan Safety

Checklist rule yang sebaiknya dipasang sejak awal:

- tidak boleh post jika ada item dengan inventory tidak aktif
- tidak boleh post jika qty melebihi stok on hand, kecuali bisnis memang mengizinkan negative stock
- semua sync harus transactional:
  - update header
  - update item
  - stock movement
  - journal entry
- reference id stock movement dan journal harus deterministic agar aman untuk sync ulang

### Strategi Implementasi Bertahap

Tahap 1:

- buat tabel header + item
- buat page baru barter
- buat draft/save/post/void dasar
- sinkron ke stock movement dan jurnal

Tahap 2:

- tambahkan reporting barter terpisah
- tambahkan filter per akun dan label
- tambahkan ringkasan nilai per periode

Tahap 3:

- evaluasi default valuation item
- jika perlu, tarik harga default dari inventory / costing
- tambah guardrail stock yang lebih ketat

## 8) Dampak Reporting

Dengan desain ini, reporting bisa dibaca di 2 level:

### Level P&L

- hanya memakai akun leaf:
  - `Iklan MP`
  - `Gaji & Insentif`
  - `Listrik & Internet`
  - dst

### Level Breakdown Operasional

- memakai kombinasi:
  - akun leaf
  - `expense_label`

Contoh:
- `62102 Listrik & Internet`
  - `Listrik`
  - `Wifi`
  - `Kuota`
  - `Server`
  - `Air`

## 9) Urutan Penyelesaian Pekerjaan

Bagian ini dibuat supaya pekerjaan tetap bisa dilanjutkan walau sesi kepotong limit.

### Fase 1: Foundation

Status:
- `done` backup akun `6xxxx`
- `done` refresh master account `61xxx` dan `62xxx`

Output:
- struktur awal COA sudah terbentuk
- payout settlement expense tetap aman

### Fase 2: Schema Opex

Status:
- `done`

Pekerjaan:
1. tambah field baru di `accounting.operational_expenses`
2. minimum yang diambil:
   - `expense_label`
3. index untuk `expense_label`

Output:
- transaksi opex bisa menyimpan detail subkategori tanpa membuat akun baru

Artefak:
- `prisma/schema.prisma`
- `prisma/migrations/20260428_add_expense_label_to_operational_expenses/migration.sql`

### Fase 3: Prisma + Validation

Status:
- `done`

Pekerjaan:
1. update `prisma/schema.prisma`
2. update schema validasi payload opex
3. update type/helper yang membaca dan menulis opex

Output:
- field baru dikenali penuh oleh layer aplikasi

### Fase 4: API Opex

Status:
- `done`

Pekerjaan:
1. update endpoint create/update/list opex
2. pastikan `expense_label` ikut tersimpan dan ikut dibaca kembali
3. pastikan backward compatibility untuk request lama tetap aman jika memungkinkan

Output:
- API siap menerima struktur transaksi opex baru

### Fase 5: UI Opex

Status:
- `done`

Pekerjaan:
1. ubah form input opex
2. user pilih:
   - akun leaf
   - label detail
3. tampilkan `expense_label` di table/list/detail

Output:
- user bisa input opex sesuai struktur baru tanpa pakai deskripsi bebas untuk semua detail

Catatan terbaru:
- UI opex manual sekarang khusus pengeluaran biasa via kas/bank
- flow barter sudah dipindahkan ke module terpisah dan tidak lagi tersedia di page opex biasa

### Fase 6: Reporting

Status:
- `next`

Pekerjaan:
1. report level akun memakai `expense_account_id`
2. report breakdown detail memakai `expense_label`
3. pisahkan pembacaan:
   - opex manual
   - payout settlement expense

Output:
- P&L tetap rapi
- breakdown operasional tetap detail

Tambahan target:
- reporting harus bisa membedakan:
  - opex manual biasa
  - barter / inventory release

### Fase 7: Smoke Test

Status:
- `done`

Pekerjaan:
1. buat 1 data opex marketing
2. buat 1 data opex operasional
3. verifikasi save, edit, list, dan jurnal
4. verifikasi label detail ikut kebaca di reporting

Output:
- struktur baru terbukti jalan end-to-end

Artefak:
- `scripts/opex-smoke-test.mjs`
- `npm run opex:smoke`

### Fase 8: Cleanup Docs

Status:
- `next`

Pekerjaan:
1. update dokumen desain ini menjadi status implementasi
2. update `docs/database-model-overview.md`
3. update onboarding kalau ada perubahan pola input opex

Output:
- dokumentasi akhir konsisten dengan code dan DB

### Fase 9: Barter Module Refactor

Status:
- `in_progress`

Pekerjaan:
1. `done` keluarkan jalur barter baru ke page terpisah
2. `done` tetapkan desain header-detail untuk barter multi-item
3. `done` buat tabel header + item untuk barter
4. `done` siapkan jurnal khusus barter yang membaca akumulasi item
5. `done` sambungkan ke stock movement per item
6. `done` rapikan cleanup flow barter lama yang masih menempel di page opex biasa
7. `done` tambahkan reporting barter terpisah

Output:
- barter menjadi modul yang skalanya cocok untuk multi-item
- opex biasa kembali sederhana
- inventory dan accounting punya jejak transaksi yang lebih rapi

## 10) Eksekusi Prioritas Berikutnya

Jika pekerjaan harus dilanjutkan bertahap, urutan paling aman adalah:

1. schema DB untuk `expense_label`
2. Prisma schema + validation
3. API opex
4. UI opex
5. reporting
6. smoke test
7. final docs
8. desain dan implementasi modul barter terpisah

## 11) Catatan Risiko

- Karena akun payout marketplace juga sekarang memakai `61114+`, pemisahan domain harus jelas:
  - payout settlement expense
  - operational expense manual
- Jangan campur akun payout dengan akun opex manual di UI jika memang konteksnya berbeda.
- Jangan teruskan desain barter single-row jika kebutuhan bisnis resminya adalah multi-item.
- Jika barter tetap dipaksa masuk ke `operational_expenses`, risiko utamanya:
  - satu transaksi sulit memuat banyak barang
  - stok sulit diaudit per item
  - valuasi transaksi gampang kabur
  - UI opex biasa menjadi terlalu kompleks
- Jika nanti owner ingin `Endorsement`, `Sampling`, atau `Komisi` tetap jadi akun sendiri, desain ini masih bisa berkembang tanpa merusak fondasi utamanya.

## 12) Status

- Dokumen ini sekarang berfungsi sebagai blueprint + tracker fase implementasi.
- Master account `6xxxx`, schema, validation, API, UI, dan sinkron jurnal opex sudah dieksekusi.
- Smoke test opex manual sudah lolos dan cleanup data test berjalan.
- Tabel `accounting.operational_expenses` masih `0` row setelah cleanup smoke test, jadi belum ada histori transaksi nyata.
- Keputusan desain terbaru: barter multi-item akan diarahkan menjadi modul terpisah, bukan diteruskan sebagai toggle di form opex biasa.
- Implementasi awal modul barter terpisah sudah jalan sampai schema, API, UI dasar, stock movement, jurnal, dan smoke test.
- Gap utama yang tersisa sekarang ada di reporting detail opex dan perapihan dokumentasi pendukung.
