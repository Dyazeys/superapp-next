# Ceklis Plan

Tanggal update: `2026-04-30`

Dokumen ini untuk rencana kerja yang sudah disepakati sebelum masuk eksekusi detail.

## Target Sistem (yang mau diberesin)

1. Alur sales-payout-retur konsisten dan aman:
  - `FAILED` payout => `sales RETUR`.
  - Retur yang boleh post stock hanya order `is_historical = false`.
2. Warehouse return jadi pintu resmi retur:
  - Verifikasi fisik barang dulu (`PENDING` -> `RECEIVED_GOOD` / `RECEIVED_DAMAGED`).
  - Post stock hanya dari modul warehouse return, bukan dari event payout langsung.
3. Data cost/BOM stabil untuk operasional:
  - Angka BOM/HPP tervalidasi, tidak mismatch antar script vs dokumen.
4. Modul ERP yang sudah jadi dijaga stabil sebelum ekspansi Analytic lanjutan.

## Rencana Aktif (Urutan Prioritas)

- [ ] P0 — Finalisasi guard historical di warehouse return
  - Scope:
    - Hard guard backend pada create return + post-stock.
    - Historical order tidak boleh masuk proses stock return.
  - Output:
    - Rule `is_historical=false` enforced 100% di server.
    - Tidak ada jalur bypass dari API.
  - Referensi eksekusi:
    - `docs/ceklis/to-do.md` -> `P0 Fix Final: Guard is_historical=false di Warehouse Return`.

- [ ] P1 — Rekonsiliasi hasil BOM batch (faktual vs klaim docs)
  - Scope:
    - Jalankan dry-run, cocokkan angka execute lama, update dokumen dengan angka faktual.
  - Output:
    - Satu sumber kebenaran angka: template count, SKU count, BOM rows, ongkir rows, error count.
  - Referensi eksekusi:
    - `docs/ceklis/to-do.md` -> `BOM Template Batch Execution - Validasi ulang angka hasil vs script`.

- [ ] P1 (Opsional) — Hardening script BOM biar lebih tahan gagal
  - Scope:
    - Proposal teknis mode upsert/idempotent yang lebih aman dibanding delete+insert.
  - Output:
    - Dokumen design patch (belum implementasi).
  - Referensi eksekusi:
    - `docs/ceklis/to-do.md` -> `Hardening script update BOM agar idempotent lebih aman`.

## Next Phase (setelah P0/P1 stabil)

- [ ] ERP -> Analytic completion wave
  - Scope:
    - Modul analytic yang masih placeholder/parsial disambungkan ke data ERP final.
  - Syarat mulai:
    - Flow sales-payout-retur dan warehouse return sudah final.
    - Angka BOM/HPP sudah tervalidasi.

---
_Catatan: `to-do.md` adalah daftar eksekusi detail. `plan.md` adalah gambaran besar tujuan sistem._
