# ✅ Done — ERP Workspace Restructuring

Berikut daftar perubahan yang sudah selesai dikerjakan dan sudah terverifikasi (build OK).

---

### Task 1: Content — TikTok (`/content/tiktok`)
- **Status:** ✅ Selesai
- **Perubahan:**
  - `app/(app)/content/tiktok/page.tsx` — ganti `ModulePlaceholder` dengan `ContentDailyWorkspace`
  - Membuat `types/content.ts` — type definitions untuk Content Daily Draft
  - Membuat `features/content/use-content-draft.ts` — hook + reducer + API stubs
  - Membuat `features/content/content-daily-workspace.tsx` — komponen workspace lengkap dengan:
    - Filter tanggal
    - Form input collapsible (tanggal, akun, jenis konten, target, actual, catatan)
    - Validasi form
    - Tabel rekap dengan aksi hapus
    - State management client-side (mock-ready, tanpa DB)

### Task 2: Content — Instagram (`/content/instagram`)
- **Status:** ✅ Selesai
- **Perubahan:**
  - `app/(app)/content/instagram/page.tsx` — ganti `ModulePlaceholder` dengan `ContentDailyWorkspace`
  - Menggunakan komponen yang sama dengan TikTok, dipisahkan per platform via prop `platform`

### Task 3: Marketing — Redirect ke Analytic (`/marketing/*`)
- **Status:** ✅ Selesai
- **Perubahan:**
  - `app/(app)/marketing/page.tsx` — landing page dengan CTA ke `/analytics`, bukan daftar sub-menu
  - `app/(app)/marketing/product-performance/page.tsx` — redirect info ke Analytic
  - `app/(app)/marketing/traffic/page.tsx` — redirect info ke Analytic
  - `app/(app)/marketing/live-streaming/page.tsx` — redirect info ke Analytic
  - Semua halaman menampilkan panel dengan CTA "Buka Analytic" + penjelasan
  - ~~`app/(app)/marketing/mp-ads/page.tsx` — redirect info ke Analytic~~ _(diganti tabel Iklan MP, lihat Task 4)_

### Task 4: Marketing — Iklan MP (`/marketing/mp-ads`)
- **Status:** ✅ Selesai
- **Prioritas:** `P0`
- **Perubahan:**
  - `types/marketing.ts` — type `MpAdsDraft` (14 kolom: date, produk, impression, click, CTR, qty-buyer, qty-produk, omset, spent, ROAS, cancel-qty, cancel-omset, ROAS-fix, target-ROAS)
  - `features/marketing/mp-ads-workspace.tsx` — komponen workspace lengkap:
    - Filter tanggal (dari/sampai + reset)
    - Form input collapsible (14 field)
    - Validasi form
    - Tabel dengan 14 kolom + aksi hapus
    - Mock data 5 baris
    - CTR ditampilkan sebagai persen (%), ROAS sebagai rasio (x)
    - State management client-side (useReducer, tanpa DB)
  - `app/(app)/marketing/mp-ads/page.tsx` — ganti redirect info dengan `MpAdsWorkspace`

### Task 5: Marketing/Iklan MP — Schema validasi (zod)
- **Status:** ✅ Selesai
- **Prioritas:** `P0`
- **Perubahan:**
  - `schemas/marketing-module.ts` — schema `mpAdsDraftSchema` validasi untuk 14 field MpAdsDraft
  - Validasi: format tanggal YYYY-MM-DD, string max 200 char, angka >= 0, integer untuk qty
  - Export `mpAdsDraftCreateSchema`, `mpAdsDraftUpdateSchema` (partial), tipe `MpAdsDraftInput`

### Task 6: Marketing/Iklan MP — API read-only stub (`GET`)
- **Status:** ✅ Selesai
- **Prioritas:** `P0`
- **Perubahan:**
  - `app/api/marketing/mp-ads/route.ts` — endpoint `GET /api/marketing/mp-ads`
  - Mock data 5 baris dari server side (bukan dari client component)
  - Response shape konsisten dengan type `MpAdsDraft`

### Task 7: Marketing/Iklan MP — Pindahkan mock data dari UI ke service/API layer
- **Status:** ✅ Selesai
- **Prioritas:** `P1`
- **Perubahan:**
  - `features/marketing/mp-ads-service.ts` — service layer `fetchMpAds()` via fetch ke `/api/marketing/mp-ads`
  - `features/marketing/mp-ads-workspace.tsx` — ganti `MOCK_ADS` lokal dengan `useEffect` + `fetchMpAds()`, initial state kosong
  - Komponen membaca data via service/fetch, bukan hardcoded di komponen

### Task 8: Marketing/Iklan MP — Enforce schema di API GET response
- **Status:** ✅ Selesai
- **Prioritas:** `P1`
- **Perubahan:**
  - `app/api/marketing/mp-ads/route.ts` — tambah `mpAdsArraySchema.safeParse()` sebelum return response
  - Import `mpAdsDraftSchema` dari `schemas/marketing-module.ts`
  - Jika validasi gagal, return `{ error, details }` dengan status 500 dan daftar issue zod yang jelas
  - Tidak ada endpoint write baru (masih read-only stub)

### Build Verification
- **Hasil:** ✅ Build sukses, 0 error, 0 warning
- **Lint:** 0 error, 0 warning
- Semua route muncul di output: `/content/tiktok`, `/content/instagram`, `/marketing/mp-ads`, `/marketing/*`


### Task 9: Marketing/Iklan MP — Refactor form ke modal popup + ganti input produk jadi SearchableSelect
- **Status:** ✅ Selesai
- **Prioritas:** `P1`
- **Perubahan:**
  - `features/marketing/mp-ads-workspace.tsx`:
    - Ganti `Collapsible` form inline dengan `ModalFormShell` (modal popup).
    - Ganti input teks "Produk" dengan `SearchableSelect` yang mengambil data dari endpoint `/api/product/products`.
    - Tambah hook `useProductOptions()` — fetch daftar produk dari master produk via API.
    - Loading state (spinner + "Memuat produk...") saat produk belum termuat.
    - Error state jika fetch produk gagal.
    - Tampilkan 14 field dalam grid (sm:2, lg:3, xl:4 kolom).
    - Aksi simpan di modal, bukan tombol inline.
  - **Lint:** 0 error, 0 warning ✅

### Task 10: Marketing/Iklan MP — Fix duplicate key pada dropdown produk
- **Status:** ✅ Selesai
- **Prioritas:** `P0`
- **Perubahan:**
  - `features/marketing/mp-ads-workspace.tsx` — `useProductOptions()`:
    - Ganti `value` option dari `product_name` (raw string) menjadi `sku` (unique key dari master produk).
    - Tambah `skuToNameRef` (Map) untuk mapping SKU → product_name.
    - Tambah helper `getNameBySku(sku)` untuk konversi SKU → nama saat value dipilih.
    - Tambah helper `getSkuByName(name)` untuk konversi nama → SKU saat render value yang sudah ada di form.
    - `SearchableSelect` menerima `value` sebagai SKU, bukan product_name.
    - `onChange("produk", ...)` tetap menyimpan product_name (string level label), tanpa relasi DB/foreign key.
    - React key di `SearchableSelect` component (dari `option.value` = SKU) menjadi unik — duplicate key error resolved.
  - **Lint:** 0 error, 0 warning ✅
