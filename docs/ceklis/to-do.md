# Ceklis To-Do

Tanggal update: `2026-05-01`

Dokumen ini hanya untuk pekerjaan yang **belum selesai**.
Pekerjaan yang sudah selesai dipindahkan ke `docs/ceklis/done.md`.

## Cara pakai

- Tulis task actionable yang benar-benar belum beres.
- Saat selesai, ubah status jadi `[x]` lalu pindahkan ringkasannya ke `done.md`.
- Jika tertunda, pindahkan ke `hold.md` dengan alasan blocker.

## Guardrail Untuk AI Murah (Wajib Ikut)

- Fokus hanya ke scope task yang tertulis.
- Jangan refactor lintas modul.
- Jangan buat migration DB kecuali diminta eksplisit.
- Jangan buat endpoint write (`POST/PATCH/DELETE`) untuk scope marketing/content sebelum diminta.
- Jangan sentuh `.env`, secret, credential, atau konfigurasi deploy.
- Jangan jalankan command destruktif.

## WARNING — Larangan Keras

- Tidak boleh ubah/hapus data production/UAT.
- Tidak boleh `rm -rf`, `git reset --hard`, `git clean -fd`, drop/truncate massal.
- Tidak boleh commit/push tanpa instruksi eksplisit.

## To-Do Aktif

- [ ] P0 — Commit semua perubahan yang sudah di-staging
  - Verifikasi terakhir: `218 files changed, 29,498 insertions(+), 558 deletions(-)`.
  - Cakupan perubahan:
    - Warehouse returns (new feature — routes, lib, workspace, migration, types)
    - Payout lifecycle + import-csv (new routes, migration, types, sync lib)
    - Sales orders (workspace, use-module, api, page)
    - Marketing mp-ads
    - Docs/ceklis update (warehouse-return-design, plan, hold, to-do, done)
    - Misc fixes (lib/format, stats-card)
    - Scripts + data imports (BOM templates, migrations, CSV data)
  - `blokir`: menunggu instruksi commit/push dari user.

- [x] P0 — ERP Marketing/Konten: rapikan struktur menu workspace (UI only)
  - File diubah: `lib/navigation.ts`
  - Ringkasan: hanya ubah sidebar menu (UI), route halaman belum dibuat.
  - Selesai: `2026-05-01`

- [ ] P0 — Konten: refactor ke 1 sumber data `daily_upload`
  - `tujuan`: seluruh aktivitas konten (IG/TikTok/YouTube) masuk ke satu tabel dan satu workspace `Daily Upload`.
  - `nama_tabel`: `daily_upload`
  - `kolom_wajib`:
    - `tanggal_aktivitas` (`DATE`)
    - `akun` (`ENUM`: `Official`, `Marketing`)
    - `platform` (`ENUM`: `Instagram`, `TikTok`, `YouTube`)
    - `jenis_konten` (`ENUM` by platform):
      - IG: `Feed`, `Story`, `Reel`
      - TikTok: `Video TikTok`
      - YT: `Video`, `Shorts`
    - `tipe_aktivitas` (`ENUM`: `Upload`, `Collab`, `Paid`, `Mirror`)
    - `produk` (`VARCHAR`, input text biasa; copy dari master produk; tanpa FK/join)
    - `link_konten` (`VARCHAR`, wajib validasi URL)
    - `pic` (`ENUM`, source dari users existing)
    - `status` (`ENUM`: `Draft`, `Uploaded`, default `Draft`)
    - `created_at`, `updated_at` (timestamps)
  - `lokasi_cek_utama`:
    - `prisma/schema.prisma` (model + enum)
    - `prisma/migrations/*daily_upload*` (migration baru khusus tabel ini)
    - `schemas/*content*` atau `schemas/*marketing*` (zod URL + enum guard)
    - `types/content.ts` (sinkron type FE dengan schema)
    - `features/content/*` (workspace tunggal Daily Upload)
    - `app/(app)/content/**` (routing ke satu halaman saja)
  - `guardrail_implementasi`:
    - Jangan buat relasi DB ke master produk (produk tetap text field).
    - Jangan pecah tabel per platform.
    - Jangan ubah modul sales/payout/warehouse saat kerjain task ini.

- Task yang selesai sudah dicatat di `docs/ceklis/done.md`.
- Task yang terblokir sudah dipindahkan ke `docs/ceklis/hold.md`.

---
_Last updated: 2026-05-01 — Tambah To-Do detail ERP Marketing/Konten + spesifikasi tabel daily_upload beserta guardrail file/menu._
