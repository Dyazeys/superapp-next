# Payout COA Structure Draft

Tanggal update: `2026-04-28`

Dokumen ini adalah turunan dari `docs/payout-account-mapping-design.md` dan berfungsi sebagai draft struktur COA final untuk payout reporting.

Status terbaru implementasi:
- akun payout batch utama sudah aktif di COA:
  - `42104` `Diskon Penjualan Shopee`
  - `42105` `Diskon Penjualan Tokopedia-Tiktokshop`
  - `61114` `Admin Fee Marketplace`
  - `61115` `Service Fee Marketplace`
  - `61116` `Order Process Fee Marketplace`
  - `61117` `Program Fee Marketplace`
  - `61118` `Affiliate Commission Marketplace`
  - `61119` `Shipping Cost Shopee`
  - `61120` `Shipping Cost Tokopedia-Tiktokshop`
- mapping payout settlement sudah aktif di layer jurnal
- `fee_transaction` sudah digabung ke `fee_order_process`
- payout reconciliation sudah membaca hasil posting jurnal payout settlement

Catatan:
- dokumen ini masih relevan sebagai working sheet naming dan scope akun
- tetapi status banyak tabel di bawah sudah tidak lagi `Pending` untuk scope utama Shopee dan Tokopedia/TikTok
- gap terbesar yang tersisa sekarang ada di reporting detail per komponen COA, bukan di mapping jurnal inti

Fokus dokumen ini:
- mendefinisikan akun mana yang perlu `per channel`
- mendefinisikan akun mana yang perlu `per komponen`
- memberi baseline sebelum master COA dan mapping code diubah di aplikasi

## 1) Prinsip Struktur

- Akun yang mewakili `pendapatan`, `diskon seller`, dan `shipping cost` dipisah per channel.
- Akun biaya marketplace dipisah per komponen biaya.
- Akun HPP dan persediaan tetap global, kecuali owner nanti memutuskan struktur aset per warehouse/channel.
- Dokumen ini belum mengunci nomor akun final baru; placeholder kode dipakai sampai owner menetapkan numbering resminya.

## 2) Klasifikasi Scope Akun

| Kelompok | Scope | Contoh |
|---|---|---|
| Revenue payout | Per channel | Penjualan Shopee, Penjualan TikTok |
| Seller discount | Per channel | Diskon Penjualan Shopee, Diskon Penjualan TikTok |
| Saldo payout | Per channel | Saldo MP Shopee, Saldo MP TikTok |
| Shipping cost | Per channel | Shipping Cost Shopee, Shipping Cost TikTok |
| Fee admin | Global per komponen | Admin Fee Marketplace |
| Fee service | Global per komponen | Service Fee Marketplace |
| Fee order process | Global per komponen | Order Process Fee Marketplace |
| Fee program | Global per komponen | Program Fee Marketplace |
| Fee affiliate | Global per komponen | Affiliate Commission Marketplace |
| HPP | Global | Harga Pokok Penjualan |
| Inventory release | Global | Persediaan Barang Dagang |

## 3) Struktur COA yang Direkomendasikan

### 3.1 Revenue dan Contra Revenue

| Jenis | Scope | Nama akun yang direkomendasikan | Kode saat ini | Status |
|---|---|---|---|---|
| Revenue Shopee | Per channel | `Penjualan Shopee` | `41101` | Existing |
| Revenue TikTok | Per channel | `Penjualan TikTok` | `41102` atau sesuai COA final | Existing / review |
| Revenue channel lain | Per channel | `Penjualan <Channel>` | `411xx` | Existing / review |
| Seller Discount Shopee | Per channel | `Diskon Penjualan Shopee` | Placeholder `421xx` | Baru |
| Seller Discount TikTok | Per channel | `Diskon Penjualan TikTok` | Placeholder `421xx` | Baru |
| Seller Discount channel lain | Per channel | `Diskon Penjualan <Channel>` | Placeholder `421xx` | Baru |

Catatan:
- akun `42102` yang sekarang dipakai global sebaiknya dipindah menjadi struktur per channel
- numbering final `421xx` perlu diputuskan owner COA

### 3.2 Saldo dan Shipping Cost

| Jenis | Scope | Nama akun yang direkomendasikan | Kode saat ini | Status |
|---|---|---|---|---|
| Saldo Shopee | Per channel | `Saldo MP - Shopee` | existing `111xx` / mapping channel | Existing |
| Saldo TikTok | Per channel | `Saldo MP - TikTok` | existing `111xx` / mapping channel | Existing / review |
| Saldo channel lain | Per channel | `Saldo MP - <Channel>` | existing `111xx` / mapping channel | Existing / review |
| Shipping Cost Shopee | Per channel | `Shipping Cost Shopee` | Placeholder `61xxx` | Baru |
| Shipping Cost TikTok | Per channel | `Shipping Cost TikTok` | Placeholder `61xxx` | Baru |
| Shipping Cost channel lain | Per channel | `Shipping Cost <Channel>` | Placeholder `61xxx` | Baru |

Catatan:
- saldo payout tetap mengikuti `saldo_account_id` channel
- shipping cost sengaja dipisah per channel karena dipakai untuk reporting channel

### 3.3 Marketplace Fee per Komponen

| Komponen payout | Scope | Nama akun yang direkomendasikan | Kode saat ini | Status |
|---|---|---|---|---|
| `fee_admin` | Global per komponen | `Admin Fee Marketplace` | Placeholder `611xx` | Baru |
| `fee_service` | Global per komponen | `Service Fee Marketplace` | Placeholder `611xx` | Baru |
| `fee_order_process` | Global per komponen | `Order Process Fee Marketplace` | Placeholder `611xx` | Baru |
| `fee_program` | Global per komponen | `Program Fee Marketplace` | Placeholder `611xx` | Baru |
| `fee_affiliate` | Global per komponen | `Affiliate Commission Marketplace` | Placeholder `611xx` | Baru |

Catatan:
- akun lama `61107` s.d. `61113` yang sekarang diturunkan dari revenue code tidak cukup granular untuk reporting target baru
- opsi sekarang yang paling disarankan adalah memisahkan akun berdasarkan jenis fee, bukan per marketplace
- jika nanti reporting minta lebih detail lagi, struktur ini masih bisa dipecah tahap kedua menjadi `per komponen per channel`

### 3.4 HPP dan Persediaan

| Jenis | Scope | Nama akun | Kode saat ini | Status |
|---|---|---|---|---|
| HPP | Global | `Harga Pokok Penjualan` | `51101` | Existing |
| Inventory release | Global | `Persediaan Barang Dagang` | `13101` | Existing |

Catatan:
- untuk flow payout saat ini, nilai pelepasan aset persediaan dibaca dari `hpp`
- artinya total aset keluar pada jurnal payout mengikuti angka `hpp`

## 4) Mapping Field ke Akun Draft

| Field payout | Target akun draft | Scope akun | Catatan |
|---|---|---|---|
| `total_price` | Revenue per channel | Per channel | mengikuti channel order |
| `omset` | Saldo payout per channel | Per channel | mengikuti `saldo_account_id` |
| `seller_discount` | Seller discount per channel | Per channel | jangan lagi satu akun global |
| `fee_admin` | Admin Fee Marketplace | Global per komponen | akun baru |
| `fee_service` | Service Fee Marketplace | Global per komponen | akun baru |
| `fee_order_process` | Order Process Fee Marketplace | Global per komponen | akun baru |
| `fee_program` | Program Fee Marketplace | Global per komponen | akun baru |
| `fee_transaction` | Digabung ke `fee_order_process` | N/A | tidak berdiri sendiri |
| `fee_affiliate` | Affiliate Commission Marketplace | Global per komponen | akun baru |
| `shipping_cost` | Shipping Cost per channel | Per channel | akun baru |
| `hpp` | HPP dan Persediaan | Global | tetap pakai akun existing |

## 5) Naming Bisnis di Memo Jurnal

Memo jurnal tetap harus tampil sesuai istilah bisnis marketplace, walau akun COA-nya bisa shared.

| Field internal | Shopee | TikTok |
|---|---|---|
| `fee_admin` | `Admin Fee` | `Admin Fee` |
| `fee_service` | `Biaya Layanan` | `Dynamic Commission` |
| `fee_order_process` | `Biaya Proses Pesanan` | `Order Processing Fee` |
| `fee_program` | `Biaya Program` | `Extra Voucher & Bonus Cashback Service Fee` |
| `fee_affiliate` | `Affiliate Commission` | `Affiliate Commission` |
| `shipping_cost` | `Shipping Cost` | `Shipping Cost` |

## 6) Rekomendasi Tahap Implementasi

Catatan status:
- Tahap implementasi inti untuk batch utama sudah lewat pada codebase saat ini.
- Bagian ini dipertahankan sebagai histori urutan kerja yang dipakai saat desain dieksekusi.

### Tahap 1

- buat akun baru untuk:
  - admin fee
  - service fee
  - order process fee
  - program fee
  - affiliate commission
- buat akun seller discount per channel
- buat akun shipping cost per channel
- ubah memo jurnal supaya pakai label komponen yang sesuai marketplace

### Tahap 2

- pindahkan mapping jurnal payout dari model lama `fee account by revenue code`
- aktifkan mapping `seller_discount` per channel
- aktifkan `shipping_cost` jika field dan data source sudah siap

### Tahap 3

- review histori jurnal payout yang lama
- putuskan apakah perlu rebuild jurnal historis atau cukup berlaku prospektif

## 7) Tabel Kerja Akun Existing vs Akun Baru

| Area | Nama akun | Scope | Kondisi sekarang | Aksi yang dibutuhkan |
|---|---|---|---|---|
| Revenue | `Penjualan Shopee` | Per channel | Sudah ada | Pertahankan |
| Revenue | `Penjualan TikTok` | Per channel | Kemungkinan sudah ada / perlu review numbering | Review |
| Revenue | `Penjualan <Channel>` lain | Per channel | Sebagian sudah ada tergantung channel | Review |
| Seller discount | `Diskon Penjualan Shopee` | Per channel | Sudah ada sebagai `42104` | Review pemakaian histori jika perlu |
| Seller discount | `Diskon Penjualan TikTok` | Per channel | Sudah ada sebagai `42105` (`Tokopedia-Tiktokshop`) | Review naming/final scope channel |
| Seller discount | `Diskon Penjualan <Channel>` lain | Per channel | Belum | Buat akun baru |
| Saldo payout | `Saldo MP - Shopee` | Per channel | Sudah ada | Pertahankan |
| Saldo payout | `Saldo MP - TikTok` | Per channel | Tergantung mapping channel aktif | Review |
| Saldo payout | `Saldo MP - <Channel>` lain | Per channel | Tergantung channel | Review |
| Shipping cost | `Shipping Cost Shopee` | Per channel | Sudah ada sebagai `61119` | Pertahankan |
| Shipping cost | `Shipping Cost TikTok` | Per channel | Sudah ada sebagai `61120` (`Tokopedia-Tiktokshop`) | Review naming/final scope channel |
| Shipping cost | `Shipping Cost <Channel>` lain | Per channel | Belum ada di flow jurnal payout | Buat akun baru |
| Fee component | `Admin Fee Marketplace` | Global per komponen | Sudah ada sebagai `61114` | Pertahankan |
| Fee component | `Service Fee Marketplace` | Global per komponen | Sudah ada sebagai `61115` | Pertahankan |
| Fee component | `Order Process Fee Marketplace` | Global per komponen | Sudah ada sebagai `61116` | Pertahankan |
| Fee component | `Program Fee Marketplace` | Global per komponen | Sudah ada sebagai `61117` | Pertahankan |
| Fee component | `Affiliate Commission Marketplace` | Global per komponen | Sudah ada sebagai `61118` | Pertahankan |
| HPP | `Harga Pokok Penjualan` | Global | Sudah ada (`51101`) | Pertahankan |
| Inventory release | `Persediaan Barang Dagang` | Global | Sudah ada (`13101`) | Pertahankan |

## 8) Checklist Keputusan Owner COA

- Finalkan akun revenue per channel yang tetap dipakai apa adanya.
- Finalkan apakah semua channel aktif perlu akun seller discount sendiri sejak tahap pertama.
- Finalkan numbering akun baru untuk:
  - seller discount per channel
  - shipping cost per channel
  - admin fee
  - service fee
  - order process fee
  - program fee
  - affiliate commission
- Finalkan apakah akun fee cukup global per komponen, atau perlu langsung dipecah juga per channel.
- Finalkan channel mana saja yang wajib disiapkan di batch pertama selain Shopee dan TikTok.

## 9) Batch 1 Akun yang Disarankan Dibuat Dulu

Catatan status:
- Batch 1 inti untuk channel utama secara praktis sudah dibuat dan dipakai.
- Bagian ini sekarang lebih tepat dibaca sebagai catatan hasil batch 1 dan referensi untuk perluasan channel berikutnya.

Fokus batch 1:
- cukup untuk mengaktifkan reporting payout yang lebih rapi
- prioritas untuk channel aktif utama: `Shopee` dan `TikTok`
- tidak menunggu seluruh channel lain dibereskan dulu

### 9.1 Akun Baru Batch 1

| Prioritas | Nama akun | Scope | Alasan |
|---|---|---|---|
| Wajib | `Diskon Penjualan Shopee` | Per channel | seller discount Shopee harus bisa dibaca terpisah dari revenue |
| Wajib | `Diskon Penjualan TikTok` | Per channel | seller discount TikTok harus bisa dibaca terpisah dari revenue |
| Wajib | `Shipping Cost Shopee` | Per channel | ongkir Shopee tidak boleh tercampur ke fee lain |
| Wajib | `Shipping Cost TikTok` | Per channel | ongkir TikTok tidak boleh tercampur ke fee lain |
| Wajib | `Admin Fee Marketplace` | Global per komponen | memisahkan admin fee dari komponen fee lain |
| Wajib | `Service Fee Marketplace` | Global per komponen | memisahkan biaya layanan / dynamic commission |
| Wajib | `Order Process Fee Marketplace` | Global per komponen | memisahkan biaya proses pesanan / order processing |
| Wajib | `Program Fee Marketplace` | Global per komponen | memisahkan biaya promo / voucher / cashback |
| Wajib | `Affiliate Commission Marketplace` | Global per komponen | memisahkan affiliate cost dari fee lain |

### 9.2 Akun Existing yang Dipakai di Batch 1

| Nama akun | Scope | Status |
|---|---|---|
| `Penjualan Shopee` | Per channel | Pakai existing |
| `Penjualan TikTok` | Per channel | Pakai existing / review numbering jika perlu |
| `Saldo MP - Shopee` | Per channel | Pakai existing |
| `Saldo MP - TikTok` | Per channel | Pakai existing jika sudah ada mapping |
| `Harga Pokok Penjualan` | Global | Pakai existing `51101` |
| `Persediaan Barang Dagang` | Global | Pakai existing `13101` |

### 9.3 Yang Belum Perlu Dipaksa di Batch 1

| Area | Alasan ditunda |
|---|---|
| Seller discount channel selain Shopee/TikTok | bisa menyusul setelah channel aktif utama stabil |
| Shipping cost channel selain Shopee/TikTok | tidak harus blocking implementasi awal |
| Pemecahan fee per komponen per channel | reporting awal sudah cukup terbantu dengan pemisahan per komponen |
| Penyusunan ulang nomor akun revenue existing | bukan blocker untuk aktivasi payout reporting |

### 9.4 Outcome Batch 1

Jika batch 1 selesai, maka reporting payout sudah akan bisa membaca:
- revenue per channel
- seller discount per channel untuk channel utama
- shipping cost per channel untuk channel utama
- admin fee
- service fee / dynamic commission
- order process fee
- program fee
- affiliate commission
- HPP dan inventory release

### 9.5 Saran Implementasi Batch 1

Urutan kerja yang paling aman:

1. Buat akun baru batch 1 di master COA.
2. Finalkan mapping channel aktif utama:
   - revenue
   - saldo
   - seller discount
   - shipping cost
3. Ubah mapping jurnal payout untuk fee components ke akun baru per komponen.
4. Ubah memo jurnal agar memakai label bisnis marketplace.
5. Test 1 payout Shopee dan 1 payout TikTok.
6. Review hasil reporting sebelum lanjut batch 2.

## 10) Working Sheet Master Account Batch 1

Tabel ini dibuat supaya proses pembuatan master account bisa langsung diisi tanpa menyusun ulang dari nol.

| Kode akun final | Nama akun | Parent / group | Scope | Sumber mapping payout | Status create | Catatan |
|---|---|---|---|---|---|---|
| `42104` | `Diskon Penjualan Shopee` | `Potongan & Pengembalian` / group contra revenue | Per channel | `seller_discount` | Created + Mapped | aktif di payout settlement |
| `42105` | `Diskon Penjualan Tokopedia-Tiktokshop` | `Potongan & Pengembalian` / group contra revenue | Per channel | `seller_discount` | Created + Mapped | naming gabungan masih perlu review jika TikTok/Tokopedia dipisah |
| `61119` | `Shipping Cost Shopee` | group beban marketplace / distribusi | Per channel | `shipping_cost` | Created + Mapped | aktif di payout settlement |
| `61120` | `Shipping Cost Tokopedia-Tiktokshop` | group beban marketplace / distribusi | Per channel | `shipping_cost` | Created + Mapped | naming gabungan masih perlu review jika TikTok/Tokopedia dipisah |
| `61114` | `Admin Fee Marketplace` | group beban marketplace | Global per komponen | `fee_admin` | Created + Mapped | aktif di payout settlement |
| `61115` | `Service Fee Marketplace` | group beban marketplace | Global per komponen | `fee_service` | Created + Mapped | aktif di payout settlement |
| `61116` | `Order Process Fee Marketplace` | group beban marketplace | Global per komponen | `fee_order_process` + `fee_transaction` TikTok | Created + Mapped | aktif di payout settlement |
| `61117` | `Program Fee Marketplace` | group beban marketplace | Global per komponen | `fee_program` | Created + Mapped | aktif di payout settlement |
| `61118` | `Affiliate Commission Marketplace` | group beban marketplace | Global per komponen | `fee_affiliate` | Created + Mapped | aktif di payout settlement |

### 10.1 Akun Existing yang Harus Direferensikan

| Kode akun sekarang | Nama akun | Parent / group | Scope | Dipakai untuk |
|---|---|---|---|---|
| `41101` | `Penjualan Shopee` | group revenue | Per channel | `total_price` Shopee |
| `41102` atau existing final | `Penjualan TikTok` | group revenue | Per channel | `total_price` TikTok |
| existing mapping channel | `Saldo MP - Shopee` | group kas / saldo channel | Per channel | `omset` Shopee |
| existing mapping channel | `Saldo MP - TikTok` | group kas / saldo channel | Per channel | `omset` TikTok |
| `51101` | `Harga Pokok Penjualan` | group HPP | Global | `hpp` debit |
| `13101` | `Persediaan Barang Dagang` | group aset dagang | Global | `hpp` credit |

### 10.2 Cara Pakai Working Sheet Ini

1. Isi `Kode akun final` sesuai keputusan owner COA.
2. Finalkan `Parent / group` mengikuti struktur akun operasional yang berlaku.
3. Tandai `Status create` menjadi:
   - `Pending`
   - `Created`
   - `Mapped`
4. Setelah akun dibuat, baru mapping payout journal bisa diubah dengan aman.

## 11) Keputusan yang Masih Terbuka

- apakah revenue TikTok dan channel lain tetap memakai numbering existing atau disusun ulang
- apakah ke depan akun fee perlu dipecah lagi menjadi `per komponen per channel`
- apakah akun gabungan `Tokopedia-Tiktokshop` tetap dipertahankan, atau perlu dipisah menjadi akun per channel murni
- channel aktif lain di luar Shopee dan TikTok/Tokopedia perlu batch akun baru atau cukup fallback sementara

## 12) Gap Reporting Yang Masih Tersisa

Yang sudah ada:
- payout settlement journal sudah mem-posting ke akun COA baru
- payout reconciliation sudah membaca hasil posting jurnal
- mismatch per channel dan per `ref` sudah bisa diaudit

Yang belum terlihat ada sebagai report khusus:
- breakdown nominal per akun fee component:
  - `61114` `Admin Fee Marketplace`
  - `61115` `Service Fee Marketplace`
  - `61116` `Order Process Fee Marketplace`
  - `61117` `Program Fee Marketplace`
  - `61118` `Affiliate Commission Marketplace`
- breakdown shipping cost per akun:
  - `61119` `Shipping Cost Shopee`
  - `61120` `Shipping Cost Tokopedia-Tiktokshop`
- breakdown seller discount per akun:
  - `42104`
  - `42105`
- tampilan P&L atau report payout yang membaca akun komponen ini langsung, bukan hanya status rekonsiliasi channel

Urutan next step yang paling masuk akal:
1. buat query/report summary payout per akun COA component
2. tambahkan filter periode + channel
3. tampilkan breakdown nominal per account code, per channel, dan per `ref` bila perlu
4. review apakah cukup read-only report, atau perlu export CSV

## 13) Status Dokumen

- Dokumen ini tidak lagi murni draft pra-implementasi.
- Master COA inti payout dan mapping jurnal settlement untuk channel utama sudah dieksekusi.
- Dokumen ini sekarang berfungsi sebagai:
  - referensi struktur akun payout
  - catatan status implementasi
  - daftar gap reporting lanjutan
