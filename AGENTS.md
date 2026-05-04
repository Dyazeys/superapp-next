# SuperApp Next — Petunjuk untuk Agent

<!-- BEGIN:nextjs-agent-rules -->
## Ini BUKAN Next.js yang kamu kenal

Versi ini memiliki perubahan signifikan — API, konvensi, dan struktur file mungkin berbeda dari data pelatihan kamu. Bacalah panduan yang relevan di `node_modules/next/dist/docs/` sebelum menulis kode. Perhatikan juga peringatan deprecation.
<!-- END:nextjs-agent-rules -->

## Setup

```bash
npm install
npm run prisma:generate   # wajib setelah install dan setelah perubahan schema
npm run dev               # menggunakan flag --webpack (next dev --webpack)
```

## Verifikasi

```bash
npm run lint               # ESLint (flat config: eslint.config.mjs)
npm run build              # output ke .next-prod (bukan .next default)
```

## Arsitektur

### Empat ruang kerja utama

App shell (`components/shell/`) berganti antara empat ruang kerja melalui icon rail. Setiap ruang kerja memiliki sidebar modul masing-masing:

| Ruang Kerja | Nav ID     | Sumber sidebar modul                    |
|-------------|------------|----------------------------------------|
| ERP         | `erp`      | `ERP_MODULE_ITEMS` di `lib/navigation.ts` |
| Analytic    | `analytics`| `ANALYTICS_MODULE_ITEMS`               |
| Task        | `task`     | `TASK_MODULE_ITEMS`                    |
| Team        | `team`     | `TEAM_MODULE_ITEMS`                    |

### RBAC

Izin didefinisikan di `lib/rbac.ts`. Item navigasi difilter oleh `hasPermission` / `hasAnyPermission` di `components/shell/module-sidebar.tsx`. Setiap item nav memiliki field `permission` atau `permissionAny`.

### Prisma — introspect, bukan migrations-first

Schema diambil dari database PostgreSQL yang sudah ada:
```bash
npm run prisma:pull        # prisma db pull --force — menimpa schema dari DB
npm run prisma:generate    # regenerate client setelah pull atau edit schema
npm run prisma:migrate      # hanya jika sengaja membuat migrations
```
Database menggunakan **8 named schemas** (accounting, auth, channel, marketing, payout, product, sales, warehouse) ditambah `public`.

### Struktur rute

Semua rute yang ter-authentication berada di `app/(app)/`. Direktori utama:
- `app/(app)/dashboard/` — overview ERP
- `app/(app)/sales/` — sales orders & customers
- `app/(app)/warehouse/` — vendors, POs, inbound, stock
- `app/(app)/accounting/` — accounts, journals, opex
- `app/(app)/payout/` — records, adjustments, transfers, reconciliation
- `app/(app)/products/` — categories, inventory, master, BOM
- `app/(app)/channel/` — channel groups dan categories
- `app/(app)/analytics/` — laporan P&L, budget meters
- `app/(app)/task/` — tasks, KPIs, attendance, calendar
- `app/(app)/team/` — users, roles, meetings, approvals
- `app/(app)/marketing/` — data Shopee & TikTok
- `app/(app)/content/` — daily uploads

### Feature modules

Setiap feature berada di `features/<domain>/`. Shared patterns (CRUD dialogs, tables, inline edits) ada di `components/patterns/`.

### DB tunnel untuk dev lokal

Dev lokal terhubung ke PostgreSQL remote via tunnel:
```bash
npm run db:tunnel          # buat SSH tunnel (lihat scripts/db-tunnel.mjs)
```

## Script Penting

| Command                     | Tujuan                                |
|-----------------------------|---------------------------------------|
| `npm run sales:smoke:fast`  | Smoke test cepat untuk alur sales    |
| `npm run sales:smoke:full`  | Smoke test lengkap untuk alur sales   |
| `npm run journal:smoke`     | Smoke test jurnal accounting          |
| `npm run payout:smoke`     | Smoke test payout                     |
| `npm run opex:smoke`       | Smoke test opex (operational expense) |
| `npm run auth:hash`        | Hash password untuk bootstrap auth    |
| `npm run auth:seed:bootstrap`| Seed role/user auth awal              |
| `npm run bom:import-csv`  | Import product BOM dari CSV           |
| `npm run go-live:check`   | PowerShell checklist go-live          |

## Konvensi

- Label UI menggunakan **Bahasa Indonesia** (contoh: "Tugas Saya", "Absensi", "Pengumuman")
- Tailwind CSS **v4** — tidak ada `tailwind.config.js`; menggunakan konfigurasi berbasis CSS
- shadcn/ui untuk komponen primitif
- React Hook Form + Zod untuk validasi form
- Zustand untuk client state (`store/`)
- TanStack React Query untuk server state
- NextAuth v4 untuk autentikasi