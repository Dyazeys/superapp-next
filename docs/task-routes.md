# Task Workspace — Routes & Features

## Overview
Task workspace adalah ruang kerja pribadi untuk mengelola tugas, KPI, absensi, kalender, dan reminder.

**Akses:** Semua role punya `TASK_WORKSPACE_VIEW`.

---

## Routes

| Route | Fitur | Status |
|-------|-------|--------|
| `/task` | Overview modul | ✓ Done |
| `/task/tugas-saya` | Hub To Do & KPI | ✓ Done |
| `/task/tugas-saya/to-do` | To Do pribadi | Placeholder |
| `/task/tugas-saya/kpi` | KPI tracking | Placeholder |
| `/task/absensi` | Hub Clock In & Izin | ✓ Done |
| `/task/absensi/clock-in-out` | Clock In/Out harian | Placeholder |
| `/task/absensi/izin-sakit` | Pengajuan izin/sakit | Placeholder |
| `/task/kalender-saya` | Kalender pribadi | Placeholder |
| `/task/reminder` | Reminder | Placeholder |

---

## Fitur Detail

### 1. To Do (`/task/tugas-saya/to-do`)
**Deskripsi:** CRUD daftar tugas pribadi dengan status dan prioritas.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Judul tugas |
| description | text | Deskripsi opsional |
| status | enum | todo / in_progress / done |
| priority | enum | low / medium / high |
| due_date | date | Tenggat waktu |

**UI:**
- DataTable dengan kolom: title, status (badge), priority (badge), due_date, actions (edit/hapus)
- ModalFormShell untuk create/edit: title, description (textarea), status (select), priority (select), due_date (date input)
- Fitur: filter by status, sort by due_date

**Permissions:** Semua user bisa CRUD task milik sendiri.

---

### 2. KPI (`/task/tugas-saya/kpi`)
**Deskripsi:** Tracking target KPI personal vs realisasi.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Nama KPI |
| target_value | number | Target |
| realization_value | number | Realisasi |
| unit | string | Satuan (%, Rp, unit) |
| period_start | date | Awal periode |
| period_end | date | Akhir periode |
| notes | text | Catatan |

**UI:**
- DataTable: title, target, realization, progress bar (%), period
- ModalFormShell: title, target, realization, unit, period_start, period_end, notes
- Progress bar hijau/kuning/merah berdasarkan gap target-realisasi

---

### 3. Clock In/Out (`/task/absensi/clock-in-out`)
**Deskripsi:** Absensi harian dengan tombol clock in / clock out.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| date | date | Tanggal |
| clock_in | datetime | Jam masuk |
| clock_out | datetime | Jam keluar |
| status | enum | present / late / early_leave |

**UI:**
- Header card: status hari ini + jam real-time besar
- Tombol Clock In (muncul kalau belum clock in)
- Tombol Clock Out (muncul kalau sudah clock in, belum clock out)
- History table: date, jam masuk, jam keluar, durasi, status (badge)

**Business rules:**
- Clock in hanya bisa sekali per hari
- Clock out hanya setelah clock in
- Status otomatis: late jika clock in > 08:00, early_leave jika clock out < 17:00

---

### 4. Izin / Sakit (`/task/absensi/izin-sakit`)
**Deskripsi:** Pengajuan izin atau sakit yang terhubung ke approval.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| type | enum | izin / sakit |
| start_date | date | Mulai |
| end_date | date | Selesai |
| reason | text | Alasan |
| attachment_url | string | Lampiran (surat dokter, dll) |
| status | enum | pending / approved / rejected |

**UI:**
- DataTable: tanggal, type (badge), status approv (badge), actions
- ModalFormShell: type (select), start_date, end_date, reason (textarea), attachment (file input)
- Tombol batal/tarik ulang jika masih pending

**Integrasi Approval:**
- Saat create → auto-create `approval_request` (type: leave)
- Status request terhubung ke halaman Approval

---

### 5. Kalender Pribadi (`/task/kalender-saya`)
**Deskripsi:** Daftar event personal + event tim yang diikuti.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Judul event |
| description | text | Deskripsi |
| start_time | datetime | Mulai |
| end_time | datetime | Selesai |
| is_team_event | boolean | Event tim atau personal |

**UI:**
- List grouped by bulan: card per event (judul, waktu, badge personal/team)
- Filter: Bulan ini / Minggu ini / Semua
- ModalFormShell: title, start_time, end_time, description
- Event tim → read-only (dikelola via Kalender Tim)

---

### 6. Reminder (`/task/reminder`)
**Deskripsi:** Pengingat pribadi dengan status baca dan snooze.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Judul |
| description | text | Deskripsi |
| remind_at | datetime | Waktu pengingat |
| is_read | boolean | Sudah dibaca |
| is_snoozed | boolean | Ditunda |

**UI:**
- List card: title, deadline, badge unread/read
- Inline actions: tandai sudah dibaca, snooze
- ModalFormShell: title, description, remind_at (datetime picker)
- Sort: unread di atas → remind_at terdekat

---

## Data Flow

```
User → Workspace Component → Hook (useTaskModule) → API Client (taskApi) → API Route → DB
                                                                                    ↓
                                                                              Mock data (sempatan)
```

## File Structure

```
features/task/
  ├── api.ts                    # API client (taskApi.todos, taskApi.kpis, ...)
  ├── use-task-module.ts        # React Query hooks (useTodos, useKpis, ...)
  ├── todo-workspace.tsx        # Component To Do
  ├── kpi-workspace.tsx         # Component KPI
  ├── clock-in-out-workspace.tsx# Component Clock In/Out
  ├── leave-request-workspace.tsx# Component Izin/Sakit
  ├── my-calendar-workspace.tsx # Component Kalender Pribadi

types/
  └── task.ts                   # Shared types

schemas/
  └── task-module.ts            # Zod validation schemas
```