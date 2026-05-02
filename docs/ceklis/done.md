# Pekerjaan Selesai (Done)

Tanggal update: `2026-05-02`

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

## P0 — ERP Marketing/Konten: tambah placeholder halaman Data Shopee & Data TikTok

- **Status:** ✅ Selesai
- **Files changed:**
  - `app/(app)/marketing/data-shopee/page.tsx` — halaman baru (placeholder)
  - `app/(app)/marketing/data-tiktok/page.tsx` — halaman baru (placeholder)
- **Changes made:**
  - Kedua halaman menggunakan `PageShell` + `WorkspacePanel` dengan deskripsi placeholder
  - Halaman sudah teregister di navigasi sidebar (`lib/navigation.ts`, route sudah ada sebelumnya)
  - Routing langsung bisa diakses via `/marketing/data-shopee` dan `/marketing/data-tiktok`
- **Scope:** Placeholder UI only — tidak ada data/API integration
- **Regression check:** Tidak mengubah halaman marketing existing, tidak mengubah permission/RBAC, tidak mengubah navigasi

## P0 — ERP -> Konten -> Daily Upload: finalize schema, API, dan form guard

- **Status:** ✅ Selesai
- **Files changed:**
  - `schemas/content-module.ts`
  - `types/content.ts`
  - `features/content/content-daily-workspace.tsx`
  - `app/api/content/daily-upload/route.ts`
  - `app/api/content/daily-upload/[id]/route.ts`
  - `app/api/content/daily-upload/pic-options/route.ts`
  - `prisma/migrations/20260501_add_daily_uploads/migration.sql`
- **Changes made:**
  - `akun` dibatasi ke `Official | Marketing`
  - `jenis_konten` disinkronkan ke final spec: `Feed`, `Story`, `Reel`, `Video TikTok`, `Video`, `Shorts`
  - tambah guard platform → jenis konten di Zod, jadi pilihan konten harus cocok dengan platform
  - `tipe_aktivitas` disinkronkan ke `Upload`, `Collab`, `Paid`, `Mirror`
  - `status` disinkronkan ke `Draft | Uploaded`
  - form `Daily Upload` sekarang pakai dropdown `akun`, dropdown `PIC`, dan opsi `jenis_konten` yang otomatis mengikuti `platform`
  - tambah endpoint opsi `PIC` dari user aktif existing
  - API create/update validasi `PIC` agar hanya menerima user aktif yang tersedia
  - migration SQL ditambah check constraints untuk `akun`, `platform`, `jenis_konten`, `tipe_aktivitas`, `status`, dan kecocokan `platform + jenis_konten`
- **Validation:**
  - Prisma schema ✅ — tabel `daily_uploads` ada di schema `marketing`
  - Migration SQL ✅ — target `marketing.daily_uploads`
  - Datasource schemas ✅ — include `"marketing"`
  - Types (`types/content.ts`) ✅ — re-export sinkron dari schema
  - Workspace FE ✅ — default value + dropdown sekarang konsisten dengan final spec
  - API routes ✅ — pakai schema final + validasi `PIC` dari user aktif
- **Final summary:** `Daily Upload` sekarang sudah final di level schema validation, API guard, form behavior, dan migration constraint untuk kebutuhan enum-like fields. `PIC` juga tidak lagi text bebas karena sudah diikat ke user aktif existing.

## P2 — ERP -> Konten -> Daily Upload: form add jadi pop-up dialog

- **Status:** ✅ Selesai
- **Files changed:** `features/content/content-daily-workspace.tsx`
- **Dialog implementation:**
  - Import `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`, `DialogTrigger` dari `@/components/ui/dialog`
  - State `showForm` (boolean) diganti dengan `open` (boolean) untuk kontrol dialog
  - Tombol "Input Baru" diubah dari toggle menjadi `DialogTrigger`
  - Form inline yang sebelumnya di-*render* di dalam `WorkspacePanel` (dengan conditional `showForm ? ... : null`) dipindahkan ke dalam `<DialogContent>`
  - Setelah submit sukses (`handleSubmit`), dialog otomatis tertutup via `setOpen(false)`
  - Tombol "Batal" dan klik backdrop → dialog tertutup tanpa menyimpan (via `onOpenChange={setOpen}`)
  - Form di-reset saat dialog dibuka ulang karena state `open` mengontrol mount/dismount dialog
- **Regression check:**
  - Tidak mengubah schema DB / migration
  - Tidak mengubah endpoint write (`POST/PATCH/DELETE`)
  - Tidak mengubah `types/content.ts`, `schemas/content-module.ts`, atau `use-content-draft.ts`
  - Filter, tabel, delete, refresh tidak tersentuh — semua logic tetap sama
  - Pre-existing TS errors di `app/(app)/payout/records/page.tsx` (4 errors) tidak terkait
- **Final summary:** Form "Input Baru" pada halaman Daily Upload kini menggunakan pop-up modal dialog. UX lebih rapi karena form tidak menggeser layout tabel. Dialog mendukung submit, batal, klik backdrop untuk tutup, dan reset form otomatis.

## P2 — Fix runtime error Dialog.Trigger nesting

- **Status:** ✅ Selesai
- **File:** `features/content/content-daily-workspace.tsx`
- **Root cause:** `<DialogTrigger>` ditempatkan di luar wrapping `<Dialog>` (error Base UI: *must be used within Dialog.Root*). JSX diubah: opening tag `<Dialog>` dipindahkan ke atas filter bar sehingga membungkus baik `<WorkspacePanel>` (yang berisi `<DialogTrigger>`) maupun `<DialogContent>`.
- **Fix:** Struktur nesting diubah dari `<WorkspacePanel>...DialogTrigger...</WorkspacePanel><Dialog>...DialogContent...</Dialog>` menjadi `<Dialog>...<WorkspacePanel>...DialogTrigger...</WorkspacePanel>...DialogContent...</Dialog>`.
- **Regression check:** Tidak ada perubahan logic, state, filter, atau tabel. Pre-existing TS errors di `payout/records/page.tsx` (2 errors, unrelated).

## P0 — Marketing: Database + CRUD MP Ads Shopee & TikTok

- **Status:** ✅ Selesai
- **Tanggal:** `2026-05-02`
- **Files changed:**
  - `prisma/schema.prisma` — tambah model `mp_ads_shopee` & `mp_ads_tiktok` di schema `marketing`
  - `prisma/migrations/20260502_add_mp_ads_shopee_tiktok/migration.sql` — migration SQL
  - `types/marketing.ts` — tambah tipe `MpAdsShopee`, `MpAdsTiktok`, `MpAdsFormData`, `MpAdsPlatform`
  - `schemas/marketing-module.ts` — tambah `mpAdsFormCreateSchema` & `mpAdsFormUpdateSchema` (Zod)
  - `app/api/marketing/mp-ads/shopee/route.ts` — GET (list) + POST (create)
  - `app/api/marketing/mp-ads/shopee/[id]/route.ts` — PUT (update) + DELETE
  - `app/api/marketing/mp-ads/tiktok/route.ts` — GET (list) + POST (create)
  - `app/api/marketing/mp-ads/tiktok/[id]/route.ts` — PUT (update) + DELETE
  - `features/marketing/mp-ads-service.ts` — service client (`fetchMpAds`, `createMpAd`, `updateMpAd`, `deleteMpAd`)
  - `features/marketing/mp-ads-workspace.tsx` — komponen DataTable + CRUD form
  - `app/(app)/marketing/data-shopee/page.tsx` — halaman Data Shopee (render `MpAdsWorkspace` platform shopee)
  - `app/(app)/marketing/data-tiktok/page.tsx` — halaman Data TikTok (render `MpAdsWorkspace` platform tiktok)
  - `app/(app)/marketing/mp-ads/page.tsx` — halaman Iklan MP (tab toggle shopee/tiktok)
- **Migration:** Deployed ✅ (2 tabel `marketing.mp_ads_shopee` & `marketing.mp_ads_tiktok`)
- **Service:** Sudah pakai API nyata (fetch ke `/api/marketing/mp-ads/{platform}`)
- **Type-check:** Pre-existing error di `payout/records/page.tsx` (unrelated)
- **Key fields per tabel:** `date`, `produk`, `impression`, `click`, `ctr`, `qty_buyer`, `qty_produk`, `omset`, `spent`, `roas`, `cancel_qty`, `cancel_omset`, `roas_fix`, `target_roas`

---
_Last updated: 2026-05-02 — P0 MP Ads Shopee & TikTok database + CRUD selesai. Pre-existing TS error di payout/records/page.tsx tidak terkait._