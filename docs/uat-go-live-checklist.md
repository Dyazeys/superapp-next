# UAT & Go-Live Checklist (SuperApp Next ERP)

Tanggal: `2026-04-11`  
Environment: `Local UAT (localhost + DB tunnel 55432)`  
PIC: `Codex + Tim Operasional`

## 1) Environment & Access

- [x] Verifikasi `.env` tersedia dan terisi (`DATABASE_URL`, `PRISMA_DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`).
- [x] Koneksi DB via Prisma berhasil (`npx prisma db execute --stdin` sukses).
- [x] DB tunnel aktif (`ssh` process berjalan untuk `127.0.0.1:55432`).
- [ ] Testing sudah dipastikan di `staging/UAT` terpisah production.
- [ ] Akun test role terbatas sudah dibuat (bukan superadmin harian).

Status: **PARTIAL**  
Catatan: koneksi teknis valid, namun pemisahan environment dan role user perlu konfirmasi manual.

## 2) Backup & Recovery

- [x] Full backup DB berhasil diambil sebelum test.
- [x] Backup disimpan dengan nama bertimestamp.
- [x] Recovery test ke DB terpisah berhasil (restore dapat dibuka).
- [x] SOP rollback disepakati jika terjadi issue kritikal.

Status: **PASS**  
Catatan: backup sukses via mode `ssh-fallback` ke file `backups/office-superapp-latest.sql`; restore drill sukses ke DB terpisah `superapp_restore_test_20260411` (sanity query: inventory=2, product=1, sales_order=4, payout=2). SOP rollback ada di `docs/rollback-sop.md`.

## 3) Master Data Readiness

- [x] Folder dropzone master data tersedia: `data/master-upload/`.
- [x] Template acuan tersedia: `docs/imports/master-data/templates/`.
- [ ] File CSV mentah sudah diupload ke `data/master-upload/`.
- [ ] Import urutan master selesai (channel/category/inventory/product/vendor/customer).
- [ ] Jumlah row source vs hasil import cocok.
- [ ] Tidak ada duplicate/null pada field wajib.

Status: **PARTIAL**  
Catatan: folder & template siap, menunggu file nyata dari user untuk proses import.

## 4) End-to-End Smoke Test

- [x] Build aplikasi sukses (`npm run build`).
- [x] Lint aplikasi sukses (`npm run lint`).
- [x] API utama produk berhasil 200:
  - `/api/product/inventory`
  - `/api/product/products`
  - `/api/product/categories`
- [x] API warehouse stock balance berhasil 200:
  - `/api/warehouse/stock-balances`
- [x] API accounting journals berhasil 200:
  - `/api/accounting/journals`
- [x] Sales Order + Sales Order Items create/update/delete sudah dites end-to-end.
- [x] Warehouse flow tulis data (inbound/adjustment) sudah dites end-to-end.
- [x] Payout flow tulis data (records/adjustments/transfers) sudah dites end-to-end.

Status: **PARTIAL**  
Catatan: smoke read endpoint lulus, skenario write end-to-end otomatis lulus (create/update/delete + cleanup data uji), UAT transaksi nyata tetap wajib.

## 5) Financial & Stock Reconciliation

- [x] Cek integritas jurnal: `unbalanced_journals = 0` (query SQL langsung).
- [ ] Gross/net payout cocok dengan sumber transaksi (sample nyata).
- [ ] Stock movement cocok dengan stock balance (sample nyata).
- [ ] Spot check minimal 10 transaksi nyata oleh user operasional.

Status: **PARTIAL**  
Catatan: validasi struktur jurnal lulus, rekonsiliasi bisnis end-to-end menunggu sample transaksi nyata.

## 6) UX & Operational Safety

- [x] Menu utama yang belum digarap nonaktif (`Analytic`, `Staff`, `CRM`, `Marketing Data`).
- [x] Perbaikan UI kritikal diterapkan (dropdown overlap, collapsed menu, navigasi shell).
- [ ] Hak akses user sudah sesuai role (perlu test akun role-based).
- [ ] Error message user-facing dievaluasi oleh user operasional.

Status: **PARTIAL**

## 7) Monitoring & Logs

- [x] Log server tersedia lokal (`.next-*.log`, `.uat-start.out.log`).
- [x] Log tunnel tersedia (`.db-tunnel*.log`) dan proses tunnel dapat dipantau.
- [x] Alerting minimum untuk error kritikal sudah aktif.
- [x] Daftar known issue dibagikan ke semua PIC.

Status: **PASS**  
Catatan: monitoring minimum didokumentasikan di `docs/monitoring-minimum.md`, known issues ada di `docs/known-issues.md`, dan smoke automation tersedia via `npm run go-live:check`.

## 8) UAT Sign-off

- [x] Semua blocker severity tinggi = 0.
- [ ] Semua test case wajib = PASS.
- [ ] PIC bisnis menyetujui hasil UAT.
- [ ] Keputusan go-live ditandatangani.

Status: **PENDING**

---

## Catatan Hasil UAT

- Temuan utama: `Error koneksi DB 127.0.0.1:55432 sudah teratasi; endpoint utama kembali 200; bug PATCH inbound items (.partial pada schema refine) sudah diperbaiki.`
- Risiko tersisa: `Sign-off bisnis/UAT final dan validasi role user operasional belum selesai.`
- Keputusan akhir: `GO untuk real test terbatas (staging/UAT), NO-GO untuk production sampai sign-off bisnis/UAT selesai.`
