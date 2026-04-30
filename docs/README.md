# Docs Index

Tanggal update: `2026-04-29`

Index ini dipakai sebagai peta status dokumen: mana yang masih jadi acuan aktif, mana yang perlu revisi, dan mana yang masih draft.

## 1) Relevan (Acuan Aktif)

### Setup & Access
- `docs/local-setup.md`
- `docs/AGENT-ONBOARDING.md`
- `docs/credential-registry.md`

### Data & Import
- `docs/imports/master-data/README.md`
- `docs/runbook-data-import-sequence.md`
- `docs/stock-opening-balance-sop.md`
- `docs/database-model-overview.md`
- `docs/data-classification-and-channel-settlement.md`
- `docs/reference-system-standard.md`

### Operasional Harian
- `docs/live-operations-cheatsheet.md`
- `docs/monitoring-minimum.md`
- `docs/rollback-sop.md`

### UAT & Tracking
- `docs/uat-transaction-checklist.md`
- `docs/uat-go-live-checklist.md`
- `docs/known-issues.md`
- `docs/reports/` (evidence historis)

## 2) Perlu Revisi (Masih Dipakai, Tapi Ada Bagian Outdated)

- `docs/auth-local-troubleshooting.md`
Catatan: masih menulis pola login `Email` padahal auth terbaru berbasis `username`.

- `docs/mac-setup-checklist.md`
Catatan: kontennya tumpang tindih dengan `docs/local-setup.md`; perlu dipadatkan atau dijadikan appendix.

- `docs/auth-role-rbac-design.md`
Catatan: awalnya draft desain; perlu sinkronisasi dengan implementasi terbaru Task/Team permission.

- `docs/auth-team-task-priority-execution.md`
Catatan: beberapa item prioritas sudah dikerjakan; perlu update status agar tidak dianggap outstanding semua.

## 3) Draft (Belum Jadi SOP Final)

- `docs/content-daily-qty-schema-draft.md`
- `docs/payout-coa-structure-draft.md`
- `docs/opex-coa-refactor-design.md` (sebagian sudah implemented, dokumen tetap berisi fase desain)

## 4) Arsip Desain (Referensi Historis, Bukan SOP Operasional)

- `docs/payout-account-mapping-design.md`
Catatan: berguna untuk konteks keputusan desain, tapi bukan runbook harian.

## Catatan Penggunaan

- Source of truth credential tetap `docs/credential-registry.md`.
- Untuk eksekusi operasional, prioritaskan dokumen di bagian `Relevan`.
- Dokumen `Perlu Revisi` jangan dipakai mentah sebagai instruksi tanpa cross-check implementasi terbaru.
