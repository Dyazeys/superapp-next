# UAT Transaction Checklist

Tanggal update: `2026-04-28`

Dokumen ini dipakai sebagai checklist pengujian transaksi setelah master data inti dinyatakan aman.

## Scope Sementara Akunting (Keputusan UAT)

- [x] Fokus UAT akunting saat ini: **Income Statement**.
- [x] Posting yang berdampak utama ke **Balance Sheet** (khususnya aset dagang/persediaan) di-`hold` dulu sampai keputusan owner final terkait metode valuasi.
- [x] Untuk modul warehouse, validasi sementara difokuskan ke integritas transaksi dan stok (`stock_movements`, `stock_balances`), bukan final posting jurnal aset.
- [x] Jurnal otomatis dari **sales order** di-`hold` dulu. Flow sales saat ini divalidasi sampai `sales order -> sales item -> stock movement`, tanpa ekspektasi jurnal sales terbentuk.
- [x] Mapping **Income Statement** untuk penjualan sekarang dibaca dari **payout** (`total_price`, `hpp`, fee marketplace, `omset`), bukan dari jurnal sales order.

## 1) Status Master Data

- [x] Master data inti sudah dites dan aman.
- [x] Pengujian transaksi dimulai dari flow operasional, bukan dari setup master.

## 2) Warehouse - Inbound Dulu (Wajib Mulai dari Sini)

- [ ] Buat 1 purchase order ke vendor utama.
- [ ] Buat inbound dari PO tersebut.
- [ ] Tambah inbound item untuk inventory yang valid.
- [ ] Pastikan stock movement inbound terbentuk.
- [ ] Cek stock balance bertambah sesuai qty inbound.
- [ ] Verifikasi tidak ada flow gantung/bocor pada inbound (header, item, posting, dan lock status).
- [ ] `Hold sementara`: verifikasi jurnal aset inbound (menunggu keputusan owner valuasi persediaan).

## 3) Warehouse - Stock Adjustment

- [ ] Buat adjustment `IN`.
- [ ] Buat adjustment `OUT`.
- [ ] Pastikan `reason` memakai nilai valid.
- [ ] Pastikan stock movement adjustment sinkron.
- [ ] `Hold sementara`: verifikasi jurnal aset adjustment (menunggu keputusan owner valuasi persediaan).

## 4) Sales - Sampai Dampak Stok

### 4.1 Sales Order

- [ ] Buat 1 sales order tanpa `customer_id` (boleh kosong).
- [ ] Isi `channel`, `order_no`, `ref_no`, dan `status`.
- [ ] Pastikan order berhasil tersimpan.
- [ ] Edit order sekali untuk memastikan update normal.
- [ ] Jika flow parent order dipakai, test 1 order dengan `parent_order_no`.

### 4.2 Sales Order Item + Dampak Stok

- [ ] Tambahkan item ke order dengan SKU yang BOM-nya lengkap.
- [ ] Tambahkan SKU kedua dengan BOM lebih kompleks.
- [ ] Ubah qty item lalu simpan.
- [ ] Hapus 1 item untuk cek stabilitas data order.
- [ ] Pastikan stock movement sales terbentuk.
- [ ] Pastikan inventory BOM berkurang sesuai qty.
- [ ] Pastikan tidak muncul error `stock-tracked BOM rows must include an inventory reference`.
- [ ] Pastikan movement tidak punya `inv_code` kosong.
- [ ] Pastikan tidak ada ekspektasi jurnal sales otomatis pada tahap ini (memang sedang di-hold).

## 5) Payout - Sampai Jurnal

### 5.1 Payout Record

- [x] Buat payout untuk order yang sudah punya `ref_no`.
- [x] Isi angka payout sederhana terlebih dulu.
- [x] Pastikan payout tersimpan dan linked ke order benar.
- [x] Edit payout sekali untuk memastikan update normal.
- [x] Verifikasi jurnal akunting payout sudah terposting.

### 5.2 Payout Transfer

- [x] Buat transfer dari payout yang baru dibuat.
- [x] Pakai akun bank `111*`.
- [x] Pastikan transfer berhasil.
- [x] Cek validasi amount tidak melebihi saldo payout.
- [x] Cek channel `SALDO` berjalan tanpa error mapping akun.
- [x] Verifikasi jurnal akunting transfer sudah terposting.

## 6) Opex - Sampai Jurnal

- [x] Buat transaksi operational expense (opex) dengan akun biaya yang sesuai.
- [x] Pastikan nominal dan referensi transaksi tersimpan benar.
- [x] Jika ada edit/koreksi, pastikan update tidak merusak histori.
- [x] Verifikasi jurnal akunting opex sudah terposting.

## 7) Error Handling

- [ ] Coba buat sales item dengan SKU nonaktif.
- [ ] Coba buat payout dengan `ref_no` yang tidak ada.
- [ ] Coba buat payout transfer dengan akun non-`111`.
- [ ] Coba buat inbound item dengan `inv_code` yang tidak ada.
- [ ] Pastikan error message jelas dan tidak merusak data lain.

## 8) Verifikasi End-to-End

- [ ] Cek total row pada tabel/modul transaksi yang diuji.
- [ ] Cocokkan 1 transaksi end-to-end:
- [ ] inbound
- [ ] adjustment
- [ ] sales order + item
- [ ] payout + transfer
- [ ] opex
- [ ] jurnal per transaksi

## 9) Urutan Test yang Disarankan (Final)

1. Warehouse PO + inbound
2. Stock adjustment
3. Sales order + sales item + dampak stok
4. Payout record + payout transfer
5. Jurnal payout + transfer (P&L related)
6. Opex
7. Jurnal opex (P&L)
8. Review posting sales journal setelah owner siap mengaktifkan kembali
9. Review posting balance sheet yang masih di-hold (inbound/adjustment) setelah keputusan owner keluar

## 10) Catatan Operasional

- `customer_id` boleh dikosongkan jika flow customer memang belum dipakai.
- Channel `DIRECT` tidak harus dipaksa memakai flow saldo.
- Channel `SALDO` sebaiknya diuji minimal satu transaksi end-to-end.
- Jika `stock_balances` kosong, isi saldo awal dulu sebelum test sales.
- Sales order saat ini tetap boleh dipost ke stok, tetapi belum dipakai sebagai sumber jurnal akunting otomatis.
- Validasi akunting dilakukan di setiap tahapan transaksi, bukan di akhir saja.
- Khusus warehouse inbound/adjustment: posting jurnal aset dagang masih status `hold sementara` sampai ada keputusan owner.
- Field `fee_transaction` sudah dipensiunkan dari flow payout aktif. Biaya transaksi lama digabung ke `fee_order_process`, dan UI payout tidak lagi menampilkan field terpisah.
- Smoke test payout yang sudah lolos pada state code saat ini:
  - `npm run payout:smoke`
  - `npm run payout:flow:smoke compact`
- Smoke test opex yang sudah lolos pada state code saat ini:
  - `npm run opex:smoke`
- Smoke test opex barter yang sudah lolos pada state code saat ini:
  - `npm run opex:barter:smoke`
