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

_Tidak ada task aktif. Semua pekerjaan sudah selesai atau dipindahkan ke `done.md` / `hold.md`._

- Task yang selesai sudah dicatat di `docs/ceklis/done.md`.
- Task yang terblokir sudah dipindahkan ke `docs/ceklis/hold.md`.

---
_Last updated: 2026-05-01 — P2 form add jadi pop-up dialog selesai. Semua task selesai._
