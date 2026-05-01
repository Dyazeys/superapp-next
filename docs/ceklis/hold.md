# Hold — Pekerjaan Tertunda

Tanggal update: `2026-04-30`

Berikut task yang tertunda karena blocker.

---

### BOM Template Batch Execution - Validasi ulang angka hasil vs script
- **Prioritas:** `P1`
- **Status:** ⏸️ **Tertunda**
- **Blocker utama:** DB tunnel `127.0.0.1:55432` `ECONNREFUSED`
- **Dampak:** script validasi BOM tidak bisa akses database.
- **Yang sudah dicoba:**
  - `node scripts/run-bom-batch.mjs dry-run` → error koneksi DB
- **Unblock checklist:**
  1. Jalankan DB tunnel sampai port `55432` aktif.
  2. Verifikasi koneksi DB sukses.
  3. Baru lanjut validasi BOM.
- **Perintah setelah unblock (urutan wajib):**
  1. `node scripts/run-bom-batch.mjs dry-run`
  2. Simpan ringkasan:
     - total template terbaca
     - total SKU target
     - total BOM rows
     - total ongkir rows
     - error count
  3. Bandingkan dengan angka klaim terakhir di `done.md`.
  4. Jika berbeda, update dokumentasi dengan angka faktual terbaru.
- **Output laporan wajib:**
  - `dry_run_summary`:
  - `execute_summary`:
  - `diff_found`:
  - `docs_updated`:

---

### (Opsional) Hardening script update BOM agar idempotent lebih aman
- **Prioritas:** `P1`
- **Status:** ⏸️ **Tertunda** (menunggu task BOM validation selesai)
- **Blocker:** Turunan dari task BOM validation; jangan dikerjakan sebelum validasi angka BOM selesai.
- **Scope saat unblock (design only):**
  1. Usulkan mode upsert/idempotent pengganti pola `delete+insert`.
  2. Definisikan key dedup yang aman.
  3. Definisikan strategy rollback jika proses batch terhenti.
- **Batasan:** jangan execute perubahan DB, hanya proposal patch (dry design).

---

### Sales Order amount = 0 (perlu verifikasi manual data sumber)
- **Prioritas:** `P1`
- **Status:** ⏸️ **Tertunda** (menunggu verifikasi manual dari owner data)
- **Konteks:**
  - Ada sisa order yang masih `total_amount = 0` di `sales.t_order`.
  - Perlu validasi manual ke sumber transaksi asli sebelum update massal.
- **Daftar order:**
  1. `SP-260422AASAKJPVPP2FE` (`ref_no=260422AASAKJPVPP2FE`)
  2. `SP-260422FQBYF33K` (`ref_no=260422FQBYF33K`)
  3. `SP-260422FRRRUW13` (`ref_no=260422FRRRUW13`)
  4. `SP-260423AAR6KD6RU7DUI` (`ref_no=260423AAR6KD6RU7DUI`)
  5. `SP-260423AAR6WWBCLYE3M` (`ref_no=260423AAR6WWBCLYE3M`)
  6. `SP-260423AASA3LD4LFOHI` (`ref_no=260423AASA3LD4LFOHI`)
  7. `SP-260427VDJ5P6A7` (`ref_no=260427VDJ5P6A7`)
  8. `TT-583641667918005334-116096` (`ref_no=583641667918005334`)
- **Unblock checklist:**
  1. Tentukan nilai order final per order dari sumber resmi (sales export/payout source of truth).
  2. Jika order memang tidak punya item/nominal, tandai sebagai valid zero.
  3. Jika harus bernilai, update `sales.t_order.total_amount` per-order (bukan update massal buta).
  4. Catat perubahan final ke `done.md`.

---
_Catatan: saat blocker selesai, pindahkan task ini ke `to-do.md` sebelum eksekusi._
