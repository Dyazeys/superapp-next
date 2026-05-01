# Pekerjaan Selesai (Done)

Tanggal update: `2026-05-01`

Ringkasan task yang sudah selesai dipindahkan dari `to-do.md`.

## P1 — Fitur search nomor order di halaman Sales Orders (refactor: server → client filtering)

- **Status:** ✅ Selesai
- **Files changed:** `app/(app)/sales/orders/page.tsx`
- **Search fields supported:** `order_no` (contains, case-insensitive), `ref_no` (contains, case-insensitive)
- **Debounce ms:** 300
- **Empty state added:** Ya — `EmptyState` component dengan pesan spesifik keyword search
- **Clear/reset:** Ya — icon `X` di input search
- **Regression check:** Search diubah dari server-side (`search` param dikirim ke API `listPaged`) jadi **client-side filtering via `useMemo`**. Query API tetap unfiltered (hanya page/pageSize/postingFilter), sehingga pagination dan CRUD existing tidak terpengaruh. Hasil API difilter di client dengan `filteredRows` yang memeriksa `order_no` dan `ref_no` secara case-insensitive. Status filter existing tetap bekerja barengan dengan search.
- **Final summary:** Fitur search order number sudah di-refactor dari server-side ke client-side filtering di halaman Sales Orders. User bisa mengetik `TT-5837` untuk filter `order_no` atau `5837650` untuk filter `ref_no`. Search bersifat additive terhadap filter posting status yang sudah ada.

## P1 — Fix EOF newline app-shell.tsx

- **Status:** ✅ Selesai
- **File:** `components/shell/app-shell.tsx`
- **Fix:** Tambah newline di akhir file (`}\n` confirmed via hex dump)
- **Regression check:** Tidak ada perubahan logic. Top-nav ambiguity logic (`topNavForPath` dengan `lastManualTop` ref) sudah menangani ERP vs Analytics fallback dengan benar di path seperti `/dashboard/report-pnl`, `/dashboard/budget-meters`, `/marketing/*`, `/content/*`.

## P0 — ERP Marketing/Konten: rapikan struktur menu workspace (UI only)

- **Status:** ✅ Selesai
- **Files changed:** `lib/navigation.ts`
- **Changes made:**
  - Tambah import `Store`, `Music`, `Upload` dari `lucide-react`
  - `MARKETING_MODULE_ITEM`: hapus "Performa Produk", tambah "Data Shopee" (icon Store) dan "Data TikTok" (icon Music) — pakai `MARKETING_WORKSPACE_VIEW` permission
  - `CONTENT_MODULE_ITEM`: ganti 2 children (Tiktok/Instagram) jadi 1 menu "Daily Upload" (icon Upload, permission `CONTENT_WORKSPACE_VIEW`)
- **Scope:** UI sidebar only — route halaman (`/marketing/data-shopee`, `/marketing/data-tiktok`, `/content/daily-upload`) belum dibuat
- **Regression check:** Tidak mengubah top-nav lain, tidak mengubah `module-sidebar.tsx` (sudah generic), tidak mengubah RBAC/permissions

## [Ringkasan task lain yang sudah selesai bisa ditambahkan di sini]

---
_Last updated: 2026-05-01_
