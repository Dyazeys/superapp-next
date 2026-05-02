# ERP Warehouse — Panduan Operasional

Dokumen ini membahas **4 skenario utama** modul Warehouse di ERP. Setiap skenario berisi tujuan, prasyarat, langkah detail, output, dan catatan penting.

---

## Daftar Menu Warehouse

| Menu | Halaman | Fungsi |
|------|---------|--------|
| **Vendors** | `/warehouse/vendors` | Kelola data pemasok |
| **Purchase Orders** | `/warehouse/purchase-orders` | Buat PO pembelian barang |
| **Inbound** | `/warehouse/inbound` | Terima & QC barang masuk |
| **Adjustments** | `/warehouse/adjustments` | Koreksi stok IN/OUT |
| **Returns** | `/warehouse/returns` | Verifikasi retur pelanggan |
| **Stock Balances** | `/warehouse/stock-balances` | Saldo on-hand (read-only) |
| **Stock Movements** | `/warehouse/stock-movements` | Riwayat ledger stok (read-only) |

---

## Skenario 1: Procurement (Vendor → PO → Inbound → QC → Stock)

### Tujuan
Mencatat pembelian barang dari vendor hingga stok masuk gudang.

### Prasyarat
- Data **Master Inventory** sudah ada di menu **Product > Master Inventory**
- Data **Vendor** sudah terdaftar (jika belum, ikuti langkah Vendor di bawah)

### Langkah-langkah

**A. Tambah Vendor (jika belum ada)**
1. Buka **ERP > Warehouse > Vendors**
2. Klik **Add vendor**
3. Isi:
   - **Vendor code** — kode unik pemasok (misal: `VND-BPK`)
   - **Vendor name** — nama lengkap perusahaan
   - **PIC name** — nama kontak person (opsional)
   - **Phone** — nomor telepon (opsional)
   - **Address** — alamat (opsional)
4. Klik **Save**
5. Vendor muncul di tabel. Nonaktifkan dengan klik tombol toggle jika vendor tidak aktif lagi.

**B. Buat Purchase Order**
1. Buka **ERP > Warehouse > Purchase Orders**
2. Klik **Add Purchase Order**
3. Isi:
   - **PO number** — nomor PO unik (misal: `PO/2026/05/001`)
   - **Vendor** — pilih dari dropdown (vendor yang sudah diinput)
   - **Order date** — tanggal PO diterbitkan
4. Klik **Create Purchase Order** — PO baru muncul di tabel
5. Klik nomor PO untuk membuka detail → tambah item:
   - **Add item** → pilih **Inventory code** (cari dari dropdown)
   - Isi **Ordered qty** — jumlah yang dipesan
   - Isi **Unit cost** — harga per unit (opsional, bisa dikosongi)
   - Klik **Save**
6. Ulangi untuk setiap item yang dipesan

> **Catatan:**
> - PO bisa diedit **selama belum ada inbound yang me-link** ke PO tersebut
> - Status PO: `OPEN` → `PARTIAL` → `CLOSED` (otomatis berubah saat inbound dipost)

**C. Terima Barang (Inbound)**
1. Buka **ERP > Warehouse > Inbound**
2. Klik **Add inbound**
3. Di form modal, isi:
   - **PO id** — pilih PO terkait (opsional, bisa dikosongi untuk inbound tanpa PO)
   - **Receive date** — tanggal barang diterima
   - **Vendor note** — nomor surat jalan vendor (opsional)
   - **Received by** — nama penerima barang
   - **Notes** — catatan tambahan (opsional)
4. Klik **Create inbound** — inbound baru muncul di tabel
5. **Klik nomor PO** di kolom pertama untuk membuka kembali form modal
6. Di panel **Inbound Items**, klik **Add item**:
   - Pilih **Inventory code** dari dropdown cari
   - Isi **Qty Received** — jumlah fisik yang diterima
   - **Qty Passed** dan **Qty Rejected** terisi otomatis, bisa disesuaikan
   - Pastikan: `passed + rejected ≤ received`
   - Isi **Unit cost** (opsional)
   - Klik **Save** (ikon floppy disk)
7. Ulangi untuk setiap barang

**D. Quality Check & Post Stock**
1. Setelah semua item terisi, klik **Post Stock** (baris hijau di kanan tabel Inbound)
2. Sistem akan:
   - Mengunci inbound → status QC berubah jadi `PASSED` atau `FAILED`
   - Mendorong stok ke ledger
   - Menutup PO jika qty pas
3. Inbound yang sudah **Locked** tidak bisa diedit lagi

### Output
- Stok barang bertambah di **Stock Balances**
- Riwayat tercatat di **Stock Movements** dengan reference `INBOUND`
- PO status berubah (jika PO ter-link)

### Edge Cases
- **Over-delivery**: jika qty melebihi PO, sistem tetap menerima tapi menandai "lebih X unit"
- **Under-delivery**: jika kurang, PO tetap `PARTIAL` — bisa dilanjut inbound berikutnya
- **Rejected items**: barang rejected tidak masuk stok
- **Tanpa PO**: inbound tetap bisa dibuat tanpa PO, cocok untuk barang non-procurement

---

## Skenario 2: Stock Adjustment (IN / OUT)

### Tujuan
Menyesuaikan stok untuk keperluan di luar pembelian normal: barang hilang, surplus, sampel, display, event, dll.

### Prasyarat
- **Master Inventory** sudah ada

### Langkah-langkah
1. Buka **ERP > Warehouse > Adjustments**
2. Klik **Add Adjustment**
3. Isi:
   - **Adjustment date** — tanggal penyesuaian
   - **Inventory code** — pilih barang yang disesuaikan
   - **Type** — pilih **IN** (stok masuk) atau **OUT** (stok keluar)
   - **Qty** — jumlah (minimal 1)
   - **Reason** — alasan penyesuaian:
     - `Loss` — barang hilang (OUT)
     - `Surplus` — kelebihan stok (IN)
     - `Rijek` — barang reject produksi (OUT)
     - `Event Masuk` — barang untuk/ dari event (IN)
     - `Event Keluar` — barang dipakai event (OUT)
     - `Konsinyasi Masuk` — titipan masuk (IN)
     - `Konsinyasi Keluar` — titipan keluar (OUT)
     - `Inventaris Konten` — properti konten (IN)
     - `Sampel Produk` — sample produk (IN/OUT)
     - `Display` — display toko (IN/OUT)
     - `Tukar Produk` — penukaran barang (IN/OUT)
   - **Notes** — keterangan tambahan (opsional)
4. Klik **Save** — status masih **DRAFT**
5. **Koreksi** jika perlu dengan klik ikon pensil
6. Jika sudah yakin, **Post Stock** (klik tombol di baris adjustment)
7. Adjustment yang sudah **POSTED** tidak bisa diedit/dihapus

### Output
- Stok bertambah/berkurang di **Stock Balances**
- Riwayat tercatat di **Stock Movements** dengan reference `ADJUSTMENT`
- Adjustment muncul dengan status `POSTED`

### Catatan
- **DRAFT** bisa diedit & dihapus kapan saja
- Jangan post adjustment jika masih ragu — simpan sebagai DRAFT dulu
- Reason dipilih dari daftar, tidak bisa custom (untuk menjaga konsistensi data)

---

## Skenario 3: Return Handling (Sales Return → Verifikasi → Stock)

### Tujuan
Menerima dan memverifikasi barang retur dari pelanggan, memisahkan barang baik (masuk stok) dan rusak.

### Prasyarat
- **Sales Order** sudah ada di sistem (data dari Shopee/TikTok)
- Sales order sudah pernah terjual (qty > 0)

### Langkah-langkah

**A. Pilih Kandidat Retur**
1. Buka **ERP > Warehouse > Returns**
2. Klik **Tambah return**
3. Cari order yang akan diretur:
   - Masukkan **Ref No** (nomor referensi dari marketplace)
   - Atau pilih dari daftar order yang muncul
4. Sistem menampilkan daftar item yang bisa diretur

**B. Isi Data Retur**
1. Isi **Return date** — tanggal retur diterima
2. Isi **Verified by** — nama petugas yang verifikasi
3. Untuk setiap item, isi:
   - **Qty good** — jumlah barang kondisi baik
   - **Qty damaged** — jumlah barang rusak
   - Pastikan: `good + damaged ≤ qty returned`
4. **Notes** — catatan (opsional)

**C. Verifikasi**
1. Pilih status verifikasi:
   - **RECEIVED GOOD** — semua atau sebagian barang baik
   - **RECEIVED DAMAGED** — semua barang rusak (tidak masuk stok)
2. Klik **Verify & Post to Stock**
3. Sistem akan:
   - Mencatat retur
   - Barang baik → stok bertambah
   - Barang rusak → tidak masuk stok (bisa dijurnal sebagai loss)

### Output
- Barang baik bertambah di **Stock Balances**
- Riwayat tercatat di **Stock Movements** dengan reference `RETURN`
- Status retur: `RECEIVED_GOOD` atau `RECEIVED_DAMAGED`

### Catatan
- **Unit cost** bisa diisi manual per item verifikasi (untuk keperluan jurnal akuntansi)
- Retur yang sudah diverifikasi tidak bisa dibatalkan — pastikan fisik barang sudah diperiksa
- Jika tidak ada kandidat cocok, cek **Sales > Sales Orders** — pastikan order sudah masuk

---

## Skenario 4: Monitoring Stok & Riwayat (Read-Only)

### Tujuan
Memantau saldo stok terkini dan riwayat pergerakan stok.

### Prasyarat
- Minimal ada 1 transaksi warehouse (inbound/adjustment/return)

### A. Stock Balances
1. Buka **ERP > Warehouse > Stock Balances**
2. Tabel menampilkan:
   - **Inventory** — kode & nama barang
   - **On Hand** — qty stok terkini (hijau > 0, merah < 0, abu = 0)
   - **Unit Price** — harga satuan (dari master inventory)
   - **Last Updated** — kapan terakhir berubah
3. Gunakan **search** untuk filter berdasarkan kode/nama barang
4. **KPI cards** di atas:
   - Total codes — jumlah semua inventory code
   - Codes with stock — yang punya stok
   - Negative codes — yang stok minus (perlu investigasi)
   - Total qty — akumulasi semua stok
   - Latest update — kapan terakhir update

### B. Stock Movements
1. Buka **ERP > Warehouse > Stock Movements**
2. Tabel menampilkan riwayat:
   - **Inventory** — kode & nama barang
   - **Date** — tanggal transaksi
   - **Qty Change** — perubahan stok (+ / -)
   - **Running Balance** — saldo setelah transaksi
   - **Reference** — jenis transaksi (`INBOUND`, `ADJUSTMENT`, `RETURN`)
   - **Notes** — keterangan
3. Gunakan filter untuk lihat per inventory code atau periode

### Output
- Informasi stok real-time untuk operasional
- Data pendukung untuk audit fisik stok

### Catatan
- Semua data **read-only** — perubahan hanya melalui transaksi (inbound/adjustment/return)
- Jika ada stok negatif, segera investigasi:
   - Cek **Stock Movements** untuk barang tersebut
   - Apakah ada adjustment OUT tanpa IN sebelumnya?
   - Apakah ada data sales/retur yang double?
- Disarankan **stock opname** rutin minimal 1x/bulan, bandingkan fisik vs sistem

---

## Referensi

- **Halaman Utama Warehouse**: `/warehouse` (ringkasan overview)
- **Error handling**: Jika ada error 500, refresh halaman. Jika masih error, hubungi IT dengan screenshot.
- **Perubahan status**: Beberapa status berubah otomatis oleh sistem (misal QC status setelah Post Stock) — tidak bisa diedit manual.