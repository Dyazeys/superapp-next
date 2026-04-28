# Payout Account Mapping Design

Tanggal update: `2026-04-28`

Dokumen ini merangkum arah perubahan mapping akun payout agar jurnal payout menjadi source utama untuk reporting Income Statement.

Status terbaru implementasi:
- mapping jurnal payout settlement sudah aktif di code
- `seller_discount` sudah dipisah per channel utama:
  - `42104` `Diskon Penjualan Shopee`
  - `42105` `Diskon Penjualan Tokopedia-Tiktokshop`
- fee marketplace sudah dipisah per komponen:
  - `61114` `Admin Fee Marketplace`
  - `61115` `Service Fee Marketplace`
  - `61116` `Order Process Fee Marketplace`
  - `61117` `Program Fee Marketplace`
  - `61118` `Affiliate Commission Marketplace`
- shipping cost payout sudah dipisah untuk channel utama:
  - `61119` `Shipping Cost Shopee`
  - `61120` `Shipping Cost Tokopedia-Tiktokshop`
- `fee_transaction` sudah digabung ke `fee_order_process` pada flow payout settlement
- memo jurnal payout sudah memakai label bisnis marketplace
- create/update/delete payout record sudah ikut sinkron ke jurnal settlement
- payout reconciliation sudah membaca hasil posting jurnal payout settlement

Catatan:
- dokumen ini sekarang bukan baseline pra-implementasi lagi, tetapi baseline desain + catatan status implementasi saat ini
- detail reporting per komponen COA payout masih perlu dilapis dengan report yang lebih eksplisit

## 1) Tujuan

- Menjadikan `payout` sebagai source jurnal utama untuk penjualan dan beban marketplace.
- Memisahkan akun biaya marketplace per komponen agar reporting lebih akurat.
- Menyelaraskan struktur akun dengan kebutuhan analisis performa per channel.
- Menghindari label jurnal yang terlalu generik seperti `admin marketplace` tanpa konteks komponen biaya sebenarnya.

## 2) Prinsip Mapping

- `total_price` dicatat sebagai pendapatan penjualan per channel.
- `omset` dicatat sebagai saldo channel per channel.
- `seller_discount` dicatat sebagai kontra pendapatan per channel.
- Komponen fee payout dipisah berdasarkan jenis biaya, bukan digabung ke satu akun biaya marketplace umum.
- `fee_transaction` tidak dipakai sebagai komponen jurnal terpisah; untuk TikTok nilainya digabung ke `fee_order_process`.
- `shipping_cost` dicatat terpisah dan direncanakan memakai akun per channel.
- `hpp` tetap menjadi dasar untuk jurnal HPP dan pelepasan persediaan.

## 3) Matriks Mapping Utama

| Field payout | Arti bisnis | Perlakuan jurnal | Scope akun | Arah desain |
|---|---|---|---|---|
| `total_price` | Nilai penjualan | Revenue | Per channel | Tetap mengikuti mapping pendapatan channel |
| `omset` | Nilai akhir masuk saldo | Saldo channel payout | Per channel | Tetap mengikuti `saldo_account_id` channel |
| `seller_discount` | Diskon / voucher seller | Kontra revenue | Per channel | Tidak lagi dianggap akun global tunggal |
| `fee_admin` | Admin fee | Beban marketplace | Akun khusus komponen | Buat COA `Admin Fee` |
| `fee_service` | Biaya layanan / dynamic commission | Beban marketplace | Akun khusus komponen | Buat COA `Service Fee` |
| `fee_order_process` | Biaya proses pesanan | Beban marketplace | Akun khusus komponen | Buat COA `Order Process Fee` |
| `fee_program` | Biaya program promo | Beban marketplace | Akun khusus komponen | Buat COA `Program Fee` |
| `fee_transaction` | Biaya transaksi | Tidak dipakai terpisah | Digabung ke komponen lain | Untuk TikTok digabung ke `fee_order_process` |
| `fee_affiliate` | Komisi affiliate | Beban marketplace | Akun khusus komponen | Buat COA `Affiliate Commission` |
| `shipping_cost` | Ongkir / biaya kirim | Beban shipping marketplace | Per channel | Buat COA `Shipping Cost` per channel |
| `hpp` | Harga pokok penjualan | Debit HPP | Global / mengikuti desain HPP | Dasar nilai HPP penjualan |
| `hpp` | Pelepasan persediaan | Credit inventory | Global / mengikuti desain inventory | Dasar pengurangan aset persediaan |

## 4) Naming Komponen per Marketplace

Nama bisnis pada jurnal harus mengikuti istilah yang familiar dari sumber payout marketplace.

### Shopee

- `fee_service` -> `Biaya Layanan`
- `fee_order_process` -> `Biaya Proses Pesanan`
- `fee_program` -> `Biaya Program`
- `fee_admin` -> `Admin Fee`
- `fee_affiliate` -> `Affiliate Commission`
- `shipping_cost` -> `Shipping Cost`

### TikTok

- `fee_service` -> `Dynamic Commission`
- `fee_order_process` -> `Order Processing Fee`
- `fee_program` -> `Extra Voucher & Bonus Cashback Service Fee`
- `fee_admin` -> `Admin Fee`
- `fee_affiliate` -> `Affiliate Commission`
- `shipping_cost` -> `Shipping Cost`

## 5) Aturan Khusus

- Memo jurnal harus memakai nama komponen bisnis, bukan label generik seperti `biaya marketplace` atau `admin shopee` untuk semua jenis biaya.
- `fee_transaction` tidak dipertahankan sebagai komponen mapping tersendiri.
- Jika source TikTok masih mengisi `fee_transaction`, nilainya harus diperlakukan sebagai bagian dari `fee_order_process`.
- `seller_discount` diperlakukan konsisten dengan revenue, yaitu perlu bisa dibaca per channel.
- `shipping_cost` tidak boleh dibiarkan di luar desain mapping jika memang dibutuhkan untuk reporting channel.

## 6) Dampak ke Reporting

- Laporan expense dapat dibaca per komponen biaya marketplace.
- Seller discount dapat dianalisis per channel, bukan hanya sebagai angka global.
- Shipping cost tidak tercampur dengan fee layanan atau fee program.
- Margin per channel menjadi lebih transparan karena sumber potongan dibaca sesuai komponen aslinya.

## 7) Dampak ke Implementasi

- Mapping COA payout di layer jurnal sudah dijalankan untuk channel utama.
- Memo / label journal line sudah memakai nama komponen bisnis marketplace.
- Akun COA inti untuk batch utama sudah ditambahkan di master COA aktif.
- Masih perlu keputusan master account final untuk akun yang bersifat per channel:
  - revenue
  - seller discount
  - shipping cost
- Perlu review data historis jika struktur akun baru akan dipakai untuk reclass atau rebuild jurnal lama.

## 8) Status Keputusan Saat Ini

- Arah desain sudah disepakati secara konsep.
- Implementasi code untuk payout settlement sudah dieksekusi untuk scope utama Shopee dan Tokopedia/TikTok.
- Master COA inti untuk seller discount, fee component, dan shipping cost channel utama sudah tersedia.
- Reconciliation payout sudah memakai hasil jurnal yang terposting, bukan hanya angka mentah tabel payout.
- Detail reporting per akun fee component belum punya layar/laporan khusus yang eksplisit.
- Channel di luar scope utama masih berpotensi memakai fallback/default mapping dan perlu review lanjutan.
