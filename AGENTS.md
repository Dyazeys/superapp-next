# SuperApp Next — Petunjuk untuk Agent

<!-- BEGIN:nextjs-agent-rules -->
## Bukan Next.js standar

Next.js 16.2.2 dengan `--webpack` (bukan Turbopack). Baca `node_modules/next/dist/docs/` sebelum menulis kode. Perhatikan peringatan deprecation.
<!-- END:nextjs-agent-rules -->

## Setup

```bash
npm install
npm run prisma:generate   # wajib setelah install dan setelah perubahan schema
npm run dev               # next dev --webpack
```

## Verifikasi

```bash
npm run lint              # ESLint flat config (eslint.config.mjs)
npm run build             # output ke .next-prod (distDir di next.config.ts)
```

## Arsitektur

### Empat ruang kerja (workspace)

App shell (`components/shell/app-shell.tsx`) berganti workspace lewat icon rail. Setiap workspace membaca sidebar dari `lib/navigation.ts`:

| Workspace  | Nav ID      | Module items constant       |
|------------|-------------|-----------------------------|
| ERP        | `erp`       | `ERP_MODULE_ITEMS`          |
| Analytic   | `analytics` | `ANALYTICS_MODULE_ITEMS`    |
| Task       | `task`      | `TASK_MODULE_ITEMS`         |
| Team       | `team`      | `TEAM_MODULE_ITEMS`         |

Path ambigu (cocok ERP dan Analytic) menggunakan preferensi workspace terakhir pengguna — lihat `topNavForPath` di `components/shell/app-shell.tsx:30`.

### Pola service per domain

Setiap domain di `features/<domain>/` mengikuti pola tiga file:

| File                       | Tujuan                              |
|----------------------------|--------------------------------------|
| `api.ts`                   | Panggilan `fetch` ke API routes      |
| `use-<domain>-module.ts`   | React Query + React Hook Form hooks  |
| `<domain>-workspace.tsx`   | Komponen UI                          |

Schema validasi Zod di `schemas/<domain>-module.ts`. Tipe TypeScript di `types/<domain>.ts`.

Pattern components: `components/patterns/crud-modal.tsx`, `data-table.tsx`, `inline-edit-row.tsx`, `inventory-picker.tsx`.

### RBAC

Izin didefinisikan di `lib/rbac.ts` (781 baris). Sidebar difilter di `components/shell/module-sidebar.tsx` via `hasPermission` / `hasAnyPermission`. Setiap nav item memiliki field `permission` atau `permissionAny`.

### Prisma — introspect, bukan migrations-first

Schema ditarik dari PostgreSQL yang sudah ada:
```bash
npm run prisma:pull        # prisma db pull --force — menimpa schema dari DB
npm run prisma:generate    # regenerate client setelah pull atau edit schema
npm run prisma:migrate     # hanya jika sengaja membuat migration
```

Database menggunakan **11 named schemas**: `accounting`, `auth`, `channel`, `marketing`, `payout`, `product`, `public`, `sales`, `warehouse`, `task`, `team`.

### DB tunnel (dev lokal)

```bash
npm run db:tunnel          # buat SSH tunnel (scripts/db-tunnel.mjs)
npm run db:tunnel:up       # PowerShell — jalankan tunnel
npm run db:tunnel:status   # PowerShell — cek status tunnel
```

### Struktur rute

Semua rute ter-autentikasi di `app/(app)/`. Direktori utama:
- `dashboard/` — overview ERP, report P&L, budget meters
- `sales/` — orders, customers, channels
- `warehouse/` — POs, inbound, stock, returns, adjustments
- `accounting/` — accounts, journals, opex, mutations, channel report
- `payout/` — records, adjustments, transfers, reconciliation
- `products/` — categories, inventory, master, BOM
- `channel/` — groups, categories
- `analytics/` — financial reports
- `task/` — todos, KPIs, routines, attendance, calendar, leave requests
- `team/` — users, roles, approvals, meetings, announcements, calendar, structure, SOP
- `marketing/` — Shopee & TikTok data, product performance
- `content/` — daily uploads

### next.config.ts

```ts
distDir: ".next-prod"
serverExternalPackages: ["@prisma/client", "prisma", "@prisma/adapter-pg", "pg"]
```

## Script

| Command                      | Tujuan                                  |
|------------------------------|-----------------------------------------|
| `npm run sales:smoke:fast`   | Smoke test alur sales (cepat)           |
| `npm run sales:smoke:full`   | Smoke test alur sales (lengkap)         |
| `npm run journal:smoke`      | Smoke test jurnal accounting            |
| `npm run payout:smoke`       | Smoke test payout                       |
| `npm run payout:flow:smoke`  | Smoke test alur payout dari sales       |
| `npm run opex:smoke`         | Smoke test opex                         |
| `npm run opex:barter:smoke`  | Smoke test opex barter                  |
| `npm run auth:hash`          | Hash password untuk bootstrap           |
| `npm run auth:seed:bootstrap`| Seed role/user auth awal                |
| `npm run bom:import-csv`     | Import BOM dari CSV                     |
| `npm run go-live:check`      | PowerShell checklist go-live            |


## Konvensi

- Label UI **Bahasa Indonesia** ("Tugas Saya", "Absensi", "Pengumuman")
- Tailwind CSS **v4** — tanpa `tailwind.config.js`; konfigurasi via CSS
- shadcn/ui untuk komponen primitif
- React Hook Form + Zod untuk validasi form (`schemas/`)
- Zustand untuk client state (`store/`)
- TanStack React Query untuk server state (`@tanstack/react-query`)
- NextAuth v4 — credentials provider (`lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`)
- `hooks/use-modal-state.ts` — helper untuk state dialog (open/close + selected item)
- `lib/password.ts` — hashing password (digunakan `auth:hash`)

## Aturan Absensi (Clock In/Out)

### Jam Kerja & Status

| Konstanta | Nilai | Keterangan |
|-----------|-------|------------|
| Jam masuk | 09:00 WIB | Batas "present" vs "late" |
| Grace period | 15 menit (09:00–09:15 WIB) | Masih dianggap "present" |
| Jam absen dibuka | 06:00 WIB | Tidak bisa clock in sebelum jam ini |
| Minimum jam kerja | 8 jam | Di bawah ini → "early_leave" |

### Clock In

| Waktu Clock In | Status | Keterangan |
|----------------|--------|------------|
| < 06:00 WIB | **REJECT** | `Belum bisa absen, jam masuk dibuka mulai pukul 06:00 WIB` |
| 06:00 – 09:15 WIB | `"present"` | On time / dalam grace period |
| > 09:15 WIB | `"late"` | Terlambat, lewat grace period |

### Clock Out

| Kondisi | Status Akhir |
|---------|---------------|
| Durasi >= 8 jam | Tidak diubah (present tetap present, late tetap late) |
| Durasi < 8 jam, status awal `"present"` | `"early_leave"` |
| Durasi < 8 jam, status awal `"late"` | `"late"` (tidak berubah) |

### Status yang Ada di Type

- `"present"` — hadir on time
- `"late"` — terlambat clock in (> 09:15 WIB)
- `"early_leave"` — pulang sebelum 8 jam kerja
- `"absent"` — **tidak pernah diset otomatis**; hanya bisa diset manual oleh admin atau scheduled job

### Timezone

Semua perhitungan jam menggunakan **WIB (UTC+7)** via `Intl.DateTimeFormat` dengan `timeZone: "Asia/Jakarta"`, **bukan** `now.getHours()` (server local time).

### File Terkait

| File | Peran |
|------|-------|
| `lib/attendance.ts` | Konstanta & fungsi `getClockInStatus()`, `getClockOutStatus()` |
| `app/api/task/attendances/clock-in/route.ts` | POST handler clock in |
| `app/api/task/attendances/clock-out/route.ts` | POST handler clock out |
| `prisma/schema.prisma` (`attendances`) | Model DB, `@@unique([user_id, date])` |
| `types/task.ts` | `TaskAttendance`, `AttendanceStatus` |
| `features/task/clock-in-out-workspace.tsx` | UI workspace |
