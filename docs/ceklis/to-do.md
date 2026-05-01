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

- [ ] P0 — ERP -> Konten -> Daily Upload: selesaikan implementasi yang masih mismatch
  - `status_sekarang`: route `/content` dan API dasar sudah ada, tapi implementasi belum sesuai spesifikasi final.
  - `wajib_dibenahi`:
    - `prisma/schema.prisma` masih menaruh `daily_uploads` di schema `public`, harus pindah ke `marketing`.
    - `prisma/migrations/20260501_add_daily_uploads/migration.sql` masih create table/index di `public.daily_uploads`, harus ke `marketing.daily_uploads`.
    - `datasource db.schemas` belum memuat schema `marketing`.
    - `schemas/content-module.ts` masih punya enum yang tidak sesuai final spec (`Live`, `Carousel`, `Published`, `Archived`, dll).
    - `types/content.ts` masih mengikuti schema lama dan perlu disinkronkan ulang setelah enum dibetulkan.
    - `app/api/content/daily-upload/**` perlu divalidasi ulang agar pakai schema final yang benar.
  - `spesifikasi_final`:
    - `akun`: `Official | Marketing`
    - `platform`: `Instagram | TikTok | YouTube`
    - `jenis_konten`: `Feed | Story | Reel | Video TikTok | Video | Shorts`
    - `tipe_aktivitas`: `Upload | Collab | Paid | Mirror`
    - `status`: `Draft | Uploaded`
  - `guardrail`: jangan sentuh Sales/Payout/Warehouse saat membereskan task ini.

- [ ] P1 — Rapikan laporan checklist agar hanya claim yang benar-benar selesai
  - `docs/ceklis/done.md`: jangan claim `daily_upload` sudah selesai penuh sebelum schema `marketing` + enum final benar.
  - `docs/ceklis/to-do.md`: simpan item menu/sidebar yang memang sudah selesai, dan sisakan implementation gap `daily_upload` sebagai task aktif.

- Task yang selesai sudah dicatat di `docs/ceklis/done.md`.
- Task yang terblokir sudah dipindahkan ke `docs/ceklis/hold.md`.

---
_Last updated: 2026-05-01 — Kembalikan Daily Upload ke To-Do aktif karena schema/enum masih mismatch; pertahankan item yang benar-benar selesai di done._
