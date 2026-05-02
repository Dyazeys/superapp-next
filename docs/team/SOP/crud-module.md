# SOP CRUD — Panduan Pengguna ERP

Tanggal: `2026-05-02`

## 1. Tujuan

Panduan ini menjelaskan cara **melihat, menambah, mengubah, dan menghapus data** (CRUD) di setiap modul ERP SuperApp.

---

## 2. Cara Mengakses Modul

1. Buka aplikasi ERP SuperApp
2. Di sidebar kiri, klik menu **"ERP"** (icon kotak-kotak)
3. Akan muncul daftar modul: **Dashboard, Sales, Warehouse, Accounting, Payout, Product, Channel, Marketing, Konten**
4. Klik salah satu modul untuk melihat sub-menu-nya

---

## 3. Operasi Dasar (Berlaku di Semua Modul)

Setiap halaman CRUD memiliki pola yang sama:

### 3.1 Melihat Data (Read)

| Langkah | Cara |
|---|---|
| Buka halaman | Pilih sub-menu dari sidebar |
| Cari data | Gunakan kolom **Search** (jika tersedia) |
| Filter data | Pilih opsi filter (contoh: filter status, tanggal) |
| Urutkan | Klik header kolom tabel untuk mengurutkan A → Z / Z → A |
| Refresh | Klik tombol **Refresh** (icon putar) untuk memuat ulang data |

Setiap data akan tampil dalam bentuk **tabel** dengan baris dan kolom.

### 3.2 Menambah Data (Create)

1. Klik tombol **"Input Baru"** (biasanya di pojok kanan atas tabel)
2. Akan muncul **jendela dialog / pop-up form**
3. Isi data yang diminta:
   - **Field wajib** — ditandai dengan label tebal atau tanda bintang merah
   - **Field opsional** — boleh dikosongkan
4. Klik tombol **"Simpan"**
5. Data baru akan muncul di tabel
6. Jika ada error, perhatikan pesan merah di form dan perbaiki

### 3.3 Mengubah Data (Update)

1. Cari baris data yang ingin diubah
2. Klik **icon pensil** (icon Edit) di baris tersebut
3. Akan muncul jendela dialog dengan data yang sudah terisi
4. Ubah data yang diperlukan
5. Klik **"Simpan"**
6. Data di tabel akan berubah

### 3.4 Menghapus Data (Delete)

> ⚠️ **Peringatan:** Data yang sudah dihapus **tidak bisa dikembalikan**.

1. Cari baris data yang ingin dihapus
2. Klik **icon tempat sampah** (icon Hapus) di baris tersebut
3. Akan muncul konfirmasi "Yakin ingin menghapus?"
4. Klik **"Ya / Hapus"** untuk melanjutkan
5. Data akan hilang dari tabel

---

## 4. Daftar Modul & Sub-Modul

Berikut daftar lengkap modul yang sudah siap digunakan beserta data yang dikelola:

### 📊 Dashboard
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Overview | Ringkasan transaksi harian | ✅ Lihat |

### 💰 Sales (Penjualan)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Sales Orders | Data pesanan / order penjualan | ✅ Lihat, Tambah, Edit, Hapus |
| Customers | Data pelanggan | ✅ Lihat, Tambah, Edit, Hapus |

### 📦 Warehouse (Gudang)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Vendors | Data pemasok / supplier | ✅ Lihat, Tambah, Edit, Hapus |
| Purchase Orders | Data pesanan pembelian | ✅ Lihat, Tambah, Edit, Hapus |
| Inbound | Data barang masuk | ✅ Lihat, Tambah, Edit, Hapus |
| Adjustments | Data penyesuaian stok | ✅ Lihat, Tambah, Edit, Hapus |
| Stock Balances | Data saldo stok | ✅ Lihat |
| Stock Movements | Data perpindahan stok | ✅ Lihat |
| Returns | Data retur barang | ✅ Lihat, Tambah, Edit, Hapus |

### 🧮 Accounting (Akuntansi)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Accounts | Data akun / kode perkiraan | ✅ Lihat, Tambah, Edit, Hapus |
| Journals | Data jurnal transaksi | ✅ Lihat, Tambah, Edit, Hapus |
| Opex (Operational Expenses) | Data biaya operasional | ✅ Lihat, Tambah, Edit, Hapus |

### 💳 Payout (Pembayaran)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Overview | Ringkasan pembayaran | ✅ Lihat |
| Records | Data pembayaran | ✅ Lihat, Tambah, Edit, Hapus |
| Adjustments | Data penyesuaian pembayaran | ✅ Lihat, Tambah, Edit, Hapus |
| Transfers | Data transfer bank | ✅ Lihat, Tambah, Edit, Hapus |
| Reconciliation | Data rekonsiliasi | ✅ Lihat, Tambah, Edit, Hapus |

### 📦 Product (Produk)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Product Categories | Data kategori produk | ✅ Lihat, Tambah, Edit, Hapus |
| Master Inventory | Data inventaris produk | ✅ Lihat |
| Master Products | Data master produk | ✅ Lihat, Tambah, Edit, Hapus |
| Product BOM | Data bill of material | ✅ Lihat, Tambah, Edit, Hapus |

### 📡 Channel (Saluran)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Channel Groups | Data grup saluran | ✅ Lihat, Tambah, Edit, Hapus |
| Channel Categories | Data kategori saluran | ✅ Lihat, Tambah, Edit, Hapus |
| Channels | Data saluran / channel | ✅ Lihat, Tambah, Edit, Hapus |

### 📢 Marketing
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Data Shopee | Iklan marketplace Shopee | ✅ Lihat, Tambah, Edit, Hapus |
| | Traffic harian Shopee | ✅ Lihat, Tambah, Edit, Hapus |
| | Live streaming Shopee | ✅ Lihat, Tambah, Edit, Hapus |
| Data TikTok | Iklan marketplace TikTok | ✅ Lihat, Tambah, Edit, Hapus |
| | Traffic harian TikTok | ✅ Lihat, Tambah, Edit, Hapus |
| | Live streaming TikTok | ✅ Lihat, Tambah, Edit, Hapus |

### ✍️ Konten
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Daily Upload | Data upload konten harian | ✅ Lihat, Tambah, Edit, Hapus |

### 👥 Team (Tim)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Users | Data pengguna & akses | ✅ Lihat, Tambah, Edit, Hapus |
| Roles & Permissions | Data peran & izin akses | ✅ Lihat, Tambah, Edit, Hapus |
| Notulen | Data notulen rapat | ✅ Lihat, Tambah, Edit, Hapus |
| Meeting To Do | Data tugas rapat | ✅ Lihat, Tambah, Edit, Hapus |
| Kalender Tim | Data jadwal tim | ✅ Lihat |
| Pengumuman | Data pengumuman | ✅ Lihat, Tambah, Edit, Hapus |
| Approval | Data persetujuan | ✅ Lihat |
| Struktur Tim | Data struktur organisasi | ✅ Lihat |
| SOP | Panduan kerja | ✅ Lihat |

### 📋 Task (Tugas)
| Sub-Modul | Data yang Dikelola | CRUD |
|---|---|---|
| Overview | Ringkasan tugas | ✅ Lihat |
| Tugas Saya | Data tugas pribadi | ✅ Lihat, Tambah, Edit, Hapus |
| To Do | Data daftar kerja | ✅ Lihat, Tambah, Edit, Hapus |
| KPI | Data indikator kinerja | ✅ Lihat, Tambah, Edit, Hapus |
| Clock In / Out | Data absensi masuk/pulang | ✅ Lihat, Isi |
| Izin / Sakit | Data izin & sakit | ✅ Lihat, Tambah, Edit, Hapus |
| Kalender Saya | Data jadwal pribadi | ✅ Lihat |
| Reminder | Data pengingat | ✅ Lihat, Tambah, Edit, Hapus |

---

## 5. Tips & Troubleshooting

### Data Tidak Muncul / Tabel Kosong
1. Pastikan tidak ada filter yang aktif — cek apakah ada tulisan filter di atas tabel
2. Klik tombol **Refresh** untuk memuat ulang
3. Jika masih kosong, coba buka halaman lain lalu kembali

### Error Saat Menyimpan Data
1. Perhatikan pesan error merah — biasanya berisi penjelasan field mana yang salah
2. Pastikan semua **field wajib** sudah diisi
3. Periksa format tanggal / angka sesuai contoh yang diminta
4. Coba simpan ulang setelah memperbaiki

### Data Tidak Bisa Dihapus
Beberapa data **tidak bisa dihapus** jika sudah dipakai di modul lain. Contoh:
- Akun yang sudah dipakai di jurnal tidak bisa dihapus
- Produk yang sudah masuk ke pesanan tidak bisa dihapus
- Customer yang sudah punya transaksi tidak bisa dihapus

Solusi: Nonaktifkan data tersebut jika ada tombol "Nonaktifkan" atau hubungi admin.

### Form Tidak Bisa Dibuka / Dialog Tidak Muncul
1. Refresh halaman (tekan F5 atau refresh browser)
2. Jika masih error, coba logout lalu login kembali

---

## 6. Melaporkan Masalah

Jika menemukan bug atau error yang tidak biasa:
1. Screenshot halaman yang error (usahakan sertakan pesan error)
2. Catat langkah-langkah yang menyebabkan error
3. Laporkan ke tim teknis melalui jalur yang tersedia

---

_Last updated: 2026-05-02_