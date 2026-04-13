# Agent Onboarding

Tanggal update: `2026-04-13`

Dokumen ini dipakai untuk mempercepat AI agent baru memahami proyek `superapp-next`.

## 1) Gambaran Proyek

- Stack: Next.js App Router + Prisma + PostgreSQL
- Domain utama:
- `product` (kategori, inventory, master product, BOM)
- `warehouse` (saldo stok, pergerakan, inbound, adjustment)
- `sales`
- `payout`
- `accounting`
- Auth lokal: NextAuth credentials berbasis env (`DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`)

## 2) Source of Truth Docs

1. `docs/README.md` (index)
2. `docs/database-model-overview.md` (model data + relasi)
3. `docs/reference-system-standard.md` (standar reference key lintas modul)
4. `docs/imports/master-data/README.md` (format import master)
5. `docs/runbook-data-import-sequence.md` (urutan import aman)
6. `docs/stock-opening-balance-sop.md` (reset + import saldo awal stok)
7. `docs/auth-local-troubleshooting.md` (troubleshoot login lokal)
8. `docs/live-operations-cheatsheet.md` + `docs/rollback-sop.md` (ops live)

## 3) Perintah Wajib Saat Mulai

```bash
npm install
npm run prisma:generate
npm run lint
npm run build
```

Untuk local dev:

```bash
npm run dev
```

## 4) Pitfalls yang Sudah Pernah Terjadi

1. Login lokal gagal karena env/password + stale `next dev` process.
- Solusi: restart process bersih, cek `docs/auth-local-troubleshooting.md`.
2. `stock_movements.reference_type` dibatasi check constraint.
- Nilai valid: `INBOUND`, `SALE`, `ADJUSTMENT`, `RETURN`.
- Untuk saldo awal gunakan `ADJUSTMENT`.
3. `master product` pricing lama (`price_mp`, `price_non_mp`) sudah deprecated di alur aplikasi.
- Jangan jadikan kolom ini sebagai requirement import baru.
4. Jika mengubah `.env`, selalu restart `next dev`.

## 5) Status Data Saat Ini (Snapshot)

- Master inti product/inventory sudah terisi.
- Saldo stok awal sudah diimport (lihat report di `docs/reports/stock-opening-import-*.json`).
- Beberapa tabel masih kosong dan sudah disiapkan template mass-edit:
- `data/master-upload/templates-empty/`

## 6) Aturan Kerja untuk Agent

1. Jangan commit secret (`.env`, kredensial plaintext).
2. Jangan commit file log lokal (`.next-*.log`).
3. Untuk perubahan data/import, simpan evidence ke `docs/reports/`.
4. Untuk perubahan flow penting, update docs terkait pada commit yang sama.
