# Ceklis To-Do

Tanggal update: `2026-04-30`

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

- [x] ERP - Marketing/Iklan MP: fix duplicate key pada dropdown produk (label-only)
  - Prioritas: `P0`
  - PIC:
  - Dependency: dropdown produk dari endpoint `/api/product/products` sudah aktif
  - Catatan eksekusi:
    - Perbaiki `key` render opsi agar unik (jangan pakai `product_name` mentah sebagai key tunggal).
    - Boleh pakai kombinasi aman seperti `sku + index` atau `product_name + index`.
    - Pertahankan model data level label (`produk` sebagai string), tanpa relasi DB.
    - Tidak mengubah schema/table, tidak menambah foreign key.
    - Verifikasi hasil: error React "Encountered two children with the same key" hilang.
