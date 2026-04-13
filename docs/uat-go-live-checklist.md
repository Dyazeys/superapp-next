# UAT & Go-Live Checklist (SuperApp Next ERP)

Tanggal update: `2026-04-13`  
Environment: `Local UAT (localhost + DB tunnel 55432)`  
PIC: `Codex + Tim Operasional`

Dokumen terkait:
- `docs/credential-registry.md`
- `docs/monitoring-minimum.md`
- `docs/rollback-sop.md`
- `docs/known-issues.md`
- `docs/runbook-data-import-sequence.md`
- `docs/stock-opening-balance-sop.md`

## Ringkasan Status

- Section PASS: `4` (`Backup & Recovery`, `Master Data Readiness`, `End-to-End Smoke Test`, `Monitoring & Logs`)
- Section PARTIAL: `3`
- Section PENDING: `1` (`UAT Sign-off`)

## 1) Environment & Access

- [x] Verifikasi `.env` tersedia dan terisi (`DATABASE_URL`, `PRISMA_DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`).
- [x] Koneksi DB via Prisma berhasil (`npx prisma db execute --stdin` sukses).
- [x] DB tunnel aktif (`ssh` process berjalan untuk `127.0.0.1:55432`).
- [x] Troubleshooting auth lokal tersedia (`docs/auth-local-troubleshooting.md`).
- [ ] Testing sudah dipastikan di `staging/UAT` terpisah production.
- [ ] Akun test role terbatas sudah dibuat (bukan superadmin harian).

Status: **PARTIAL**

## 2) Backup & Recovery

- [x] Full backup DB berhasil diambil sebelum test.
- [x] Backup disimpan dengan nama bertimestamp.
- [x] Recovery test ke DB terpisah berhasil (restore dapat dibuka).
- [x] SOP rollback disepakati jika terjadi issue kritikal.

Status: **PASS**

## 3) Master Data Readiness

- [x] Folder dropzone master data tersedia: `data/master-upload/`.
- [x] Template acuan tersedia: `docs/imports/master-data/templates/`.
- [x] File CSV master aktual sudah tersedia di `data/master-upload/`.
- [x] Import `product_category`, `inventory`, `product` sudah dieksekusi.
- [x] Saldo stok awal sudah diimport (`docs/reports/stock-opening-import-2026-04-13T08-03-30-747Z.json`).
- [x] Template mass-edit untuk tabel kosong tersedia (`data/master-upload/templates-empty/`).
- [ ] Import `vendor` dan `customer` final dari admin belum dieksekusi.

Status: **PASS** (untuk fase foundation master + stok awal)

## 4) End-to-End Smoke Test

- [x] Build aplikasi sukses (`npm run build`).
- [x] Lint aplikasi sukses (`npm run lint`).
- [x] API utama produk, warehouse, sales, payout, accounting berhasil `HTTP 200`.
- [x] Sales Order + Sales Order Items create/update/delete sudah dites end-to-end.
- [x] Warehouse flow tulis data (inbound/adjustment) sudah dites end-to-end.
- [x] Payout flow tulis data (records/adjustments/transfers) sudah dites end-to-end.

Status: **PASS**

## 5) Financial & Stock Reconciliation

- [x] Cek integritas jurnal: `unbalanced_journals = 0` (query SQL langsung).
- [x] Konsistensi saldo stok awal: `stock_balances` dan `stock_movements` sinkron saat inisialisasi.
- [ ] Gross/net payout cocok dengan sumber transaksi nyata (sample bisnis).
- [ ] Spot check minimal 10 transaksi nyata oleh user operasional.

Status: **PARTIAL**

## 6) UX & Operational Safety

- [x] Perbaikan UI kritikal login + header shell diterapkan.
- [x] Menu non-prioritas tetap nonaktif sesuai fase rollout.
- [ ] Hak akses user sudah sesuai role (perlu test akun role-based).
- [ ] Error message user-facing dievaluasi oleh user operasional.

Status: **PARTIAL**

## 7) Monitoring & Logs

- [x] Log server tersedia lokal (`.next-*.log`, `.uat-start.out.log`).
- [x] Log tunnel tersedia (`.db-tunnel*.log`) dan proses tunnel dapat dipantau.
- [x] Alerting minimum untuk error kritikal sudah aktif.
- [x] Daftar known issue dibagikan ke semua PIC.

Status: **PASS**

## 8) UAT Sign-off

- [x] Semua blocker severity tinggi = 0.
- [ ] Semua test case wajib = PASS.
- [ ] PIC bisnis menyetujui hasil UAT.
- [ ] Keputusan go-live ditandatangani.

Status: **PENDING**

---

## Catatan Hasil UAT

- Temuan utama: import master inti dan saldo stok awal sudah berjalan baik, dengan jejak report terdokumentasi.
- Risiko tersisa: sign-off bisnis/UAT final, role-based access, serta input master vendor/customer final dari admin.
- Keputusan akhir: `GO untuk real test terbatas (UAT internal), NO-GO production sampai sign-off bisnis selesai.`
