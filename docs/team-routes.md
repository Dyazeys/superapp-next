# Team Workspace — Routes & Features

## Overview
Team workspace adalah ruang kerja kolaboratif tim untuk meeting, pengumuman, approval, SOP, dan manajemen user/role.

**Akses:** Semua role punya `TEAM_WORKSPACE_VIEW`.

---

## Routes

| Route | Fitur | Status |
|-------|-------|--------|
| `/team` | Overview modul | ✓ Done |
| `/team/meeting` | Hub Meeting | ✓ Done |
| `/team/meeting/notulen` | Notulen rapat | Placeholder |
| `/team/meeting/to-do` | Action items meeting | Placeholder |
| `/team/users` | Manajemen user | ✓ Done |
| `/team/users/[id]/profile` | Profil user | ✓ Done |
| `/team/roles` | Role & permission | ✓ Done |
| `/team/sop` | SOP viewer | ✓ Done |
| `/team/kalender-tim` | Kalender tim | Placeholder |
| `/team/pengumuman` | Pengumuman internal | Placeholder |
| `/team/approval` | Approval request | Placeholder |
| `/team/struktur-tim` | Struktur organisasi | Placeholder |
| `/team/absensi` | Redirect → `/task/absensi` | Legacy |
| `/team/tugas-saya` | Redirect → `/task/tugas-saya` | Legacy |

---

## Fitur Detail

### 1. Notulen Meeting (`/team/meeting/notulen`)
**Deskripsi:** CRUD meeting beserta notulen. Bisa disubmit untuk approval.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Judul meeting |
| date | date | Tanggal |
| start_time | time | Jam mulai |
| end_time | time | Jam selesai |
| location | string | Tempat/link |
| participants | user[] | Peserta meeting |
| notes | text/JSON | Isi notulen |
| status | enum | draft / pending / approved |

**UI:**
- DataTable: title, date, organizer, participants count, status (badge)
- ModalFormShell 3-section:
  - **Info:** title, date, start_time, end_time, location
  - **Peserta:** multi-select user (searchable select)
  - **Notulen:** textarea besar (markdown-supported)
- Tombol "Ajukan Approval" → create approval_request
- Siapa bisa edit: organizer atau superadmin

**Integrasi Approval:**
- Status draft → klik "Ajukan" → status pending → approval_request dibuat
- Setelah approved → status approved, notulen terkunci (read-only)
- Setelah rejected → status kembali draft, bisa diedit dan resubmit

---

### 2. To Do Meeting (`/team/meeting/to-do`)
**Deskripsi:** Action items hasil meeting dengan PIC dan deadline.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| meeting_id | FK | Meeting terkait |
| title | string | Action item |
| description | text | Detail |
| assignee_id | FK | Penanggung jawab |
| status | enum | todo / in_progress / done |
| priority | enum | low / medium / high |
| due_date | date | Deadline |

**UI:**
- DataTable: title, meeting, assignee, status (badge), due_date
- Filter dropdown: pilih meeting
- ModalFormShell: meeting (select), title, description, assignee (select user), status, priority, due_date
- Fitur: update status inline (checkbox)

---

### 3. Kalender Tim (`/team/kalender-tim`)
**Deskripsi:** Kalender kolaboratif untuk event tim.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Judul event |
| description | text | Deskripsi |
| start_time | datetime | Mulai |
| end_time | datetime | Selesai |
| participants | user[] | Peserta |
| is_team_event | boolean | true |

**UI:**
- List grouped by bulan: card per event (judul, waktu, badge team, jumlah peserta)
- Filter: Bulan ini / Minggu ini / Semua
- ModalFormShell: title, start_time, end_time, description, participants (multi-select)
- Event tim muncul juga di Kalender Pribadi peserta
- Siapa bisa edit: organizer atau superadmin

---

### 4. Pengumuman (`/team/pengumuman`)
**Deskripsi:** Pengumuman internal tim dengan approval workflow.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| title | string | Judul |
| content | text | Isi pengumuman |
| author_id | FK | Pembuat |
| category | enum | umum / operasional / kebijakan / event |
| is_pinned | boolean | Pin ke atas |
| status | enum | draft / pending / published |
| read_by | user[] | Yang sudah baca |

**UI:**
- List card: title (bold kalau unread), excerpt, author, timestamp, badge pinned/new
- Klik card → expand full content (inline)
- Counter: "12/45 sudah membaca"
- Create/Edit: ModalFormShell (title, content[textarea], category[select], is_pinned[toggle])
- Role: Admin/Leader bisa create & publish, semua user bisa baca

**Integrasi Approval:**
- Saat create → auto-create approval_request, status = pending
- Approved → status = published, muncul di feed semua user
- Rejected → kembali ke draft, author bisa edit dan resubmit

---

### 5. Approval (`/team/approval`)
**Deskripsi:** Pusat approval untuk semua request lintas modul.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| type | enum | leave / announcement / meeting_note |
| source_id | FK | ID dari source module |
| requester_id | FK | Yang request |
| title | string | Ringkasan request |
| status | enum | pending / approved / rejected |
| decision_note | text | Catatan keputusan |
| decided_by | FK | Yang memutuskan |
| decided_at | datetime | Waktu keputusan |

**UI:**
- DataTable: type (badge icon), title, requester, date, status (badge), actions
- Filter tabs: Pending / Disetujui / Ditolak
- Filter by type: Semua / Izin / Pengumuman / Notulen
- Row expand: click → lihat detail request (siapa, apa isinya, timeline)
- Action buttons: Approve (hijau) / Reject (merah)
- Klik action → modal konfirmasi + textarea untuk decision note

**Integrasi:**
- Approve → update status source module (leave.request → approved, announcement → published, meeting_note → approved)
- Reject → update status source module (leave.request → rejected, announcement → draft, meeting_note → draft)

**Permissions:**
- Lihat semua request: user dengan role LEADER / DIREKTUR / OWNER
- Approve/Reject: user dengan role LEADER / DIREKTUR / OWNER
- User biasa hanya lihat request milik sendiri

---

### 6. Struktur Tim (`/team/struktur-tim`)
**Deskripsi:** Struktur organisasi dalam bentuk tree department.

**Data:**
| Field | Type | Keterangan |
|-------|------|------------|
| Department: | | |
| name | string | Nama departemen |
| parent_id | FK | Induk departemen |
| head_user_id | FK | Kepala departemen |
| Department Member: | | |
| department_id | FK | Departemen |
| user_id | FK | Anggota |
| role_title | string | Jabatan di departemen |

**UI:**
- Tree view nested: department induk → sub-department → anggota
- Card per department: nama, head user (avatar + nama), jumlah anggota
- Klik → expand/collapse sub-department
- Manage Departments modal: tabel department + add/edit/hapus
- Manage Members modal: di dalam department card, add/remove user, edit role_title
- Users ditampilkan: avatar, nama, jabatan

**Permissions:**
- Lihat struktur: semua user
- Edit struktur: LEADER / DIREKTUR / OWNER

---

## Approval Flow (Lintas Modul)

```
┌─────────────────────┐
│   Source Module     │
│                     │
│ Izin/Sakit dibuat   │──→ auto-create approval_request
│ Pengumuman dibuat   │──→ auto-create approval_request
│ Notulen disubmit    │──→ auto-create approval_request
│                     │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   Approval Page     │
│                     │
│ Approver lihat      │
│ pending requests    │
│ Klik Approve/Reject │
│ + isi decision note │
│                     │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Status Propagation  │
│                     │
│ Izin → disetujui    │
│ Pengumuman → publish│
│ Notulen → approved  │
│                     │
└─────────────────────┘
```

---

## Data Flow

```
User → Workspace Component → Hook → API Client → API Route → DB
                                                         ↓
                                                   Mock data (sempatan)
```

## File Structure

```
features/team/
  ├── api.ts                         # Diperluas: meetingApi, announcementApi, ...
  ├── use-team-module.ts             # Diperluas: useMeetings, useAnnouncements, ...
  ├── meeting-notes-workspace.tsx    # Component Notulen
  ├── meeting-todo-workspace.tsx     # Component To Do Meeting
  ├── team-calendar-workspace.tsx    # Component Kalender Tim
  ├── announcement-workspace.tsx     # Component Pengumuman
  ├── approval-workspace.tsx         # Component Approval
  ├── structure-workspace.tsx        # Component Struktur Tim

features/task/
  ├── (semua component task)

types/
  ├── task.ts
  └── team.ts                        # Diperluas: MeetingRecord, AnnouncementRecord, ...

schemas/
  ├── task-module.ts
  └── meeting-module.ts              # Zod: meetingInputSchema, announcementInputSchema, ...
```