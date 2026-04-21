# UAT Transaction Checklist

Tanggal update: `2026-04-21`

Dokumen ini dipakai sebagai checklist pengujian transaksi setelah master data inti sudah siap.

## 1) Precheck Master

- [ ] Buka modul `Products` dan pastikan product aktif tampil normal.
- [ ] Buka modul `BOM` dan cek beberapa SKU random punya komponen lengkap.
- [ ] Buka modul `Channel` dan pastikan channel yang akan dipakai test tersedia.
- [ ] Buka modul `Accounts` dan cek akun `111*`, `revenue`, `piutang`, dan `saldo` tersedia.
- [ ] Buka modul `Vendors` dan pastikan vendor utama tersedia.

## 2) Sales Order

- [ ] Buat 1 sales order tanpa `customer_id`.
- [ ] Isi `channel`, `order_no`, `ref_no`, dan `status`.
- [ ] Pastikan order berhasil tersimpan.
- [ ] Edit order tersebut sekali untuk memastikan update normal.
- [ ] Jika flow parent order dipakai, coba buat 1 order dengan `parent_order_no`.

## 3) Sales Order Item

- [ ] Tambahkan item ke order dengan SKU normal yang BOM-nya lengkap.
- [ ] Pastikan item berhasil dibuat.
- [ ] Tambahkan SKU lain yang BOM-nya lebih kompleks.
- [ ] Ubah qty item lalu simpan.
- [ ] Hapus 1 item lalu cek order tetap sehat.

## 4) Dampak Stok dari Sales

- [ ] Setelah tambah item sales, cek `stock movement` terbentuk.
- [ ] Cek inventory yang dipakai BOM berkurang sesuai qty.
- [ ] Pastikan tidak muncul error `stock-tracked BOM rows must include an inventory reference`.
- [ ] Pastikan movement tidak punya `inv_code` kosong.

## 5) Payout Record

- [ ] Buat payout untuk order yang punya `ref_no`.
- [ ] Isi angka payout sederhana terlebih dulu.
- [ ] Pastikan payout tersimpan dan linked ke order yang benar.
- [ ] Edit payout sekali untuk memastikan update normal.

## 6) Payout Transfer

- [ ] Buat transfer dari payout yang baru dibuat.
- [ ] Pakai akun bank `111*`.
- [ ] Pastikan transfer berhasil.
- [ ] Cek validasi amount tidak melebihi saldo payout.
- [ ] Cek channel `SALDO` berjalan tanpa error mapping akun.

## 7) Journal

- [ ] Setelah sales item dibuat, cek journal sales terbentuk.
- [ ] Setelah payout dibuat, cek journal payout terbentuk.
- [ ] Setelah payout transfer dibuat, cek journal transfer terbentuk.
- [ ] Pastikan akun debit/kredit masuk ke akun yang masuk akal.

## 8) Warehouse Dasar

- [ ] Buat 1 purchase order ke vendor.
- [ ] Buat inbound dari PO tersebut.
- [ ] Tambah inbound item.
- [ ] Pastikan stock movement inbound terbentuk.
- [ ] Cek stock balance bertambah sesuai item inbound.

## 9) Stock Adjustment

- [ ] Buat adjustment `IN`.
- [ ] Buat adjustment `OUT`.
- [ ] Pastikan `reason` memakai nilai yang valid.
- [ ] Pastikan stock movement adjustment tersinkron.

## 10) Error Handling

- [ ] Coba buat sales item dengan SKU nonaktif.
- [ ] Coba buat payout dengan `ref_no` yang tidak ada.
- [ ] Coba buat payout transfer dengan akun non-`111`.
- [ ] Coba buat inbound item dengan `inv_code` yang tidak ada.
- [ ] Pastikan error message jelas dan tidak merusak data lain.

## 11) Verifikasi Hasil

- [ ] Cek total row pada tabel/modul transaksi yang diuji.
- [ ] Cocokkan 1 transaksi end-to-end:
- [ ] order
- [ ] item
- [ ] stok
- [ ] payout
- [ ] transfer
- [ ] jurnal

## 12) Urutan Test yang Disarankan

1. Sales order
2. Sales item
3. Stock movement
4. Payout
5. Transfer
6. Journal
7. Warehouse PO / inbound
8. Adjustment

## 13) Catatan Operasional

- `customer_id` boleh dikosongkan jika flow customer memang belum dipakai.
- Channel `DIRECT` tidak harus dipaksa memakai flow saldo.
- Channel `SALDO` sebaiknya diuji minimal satu transaksi end-to-end.
- Jika `stock_balances` sedang kosong, isi ulang saldo awal dulu sebelum test flow sales yang memotong stok.
