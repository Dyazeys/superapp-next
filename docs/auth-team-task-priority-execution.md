# Auth/Team/Task Priority Execution (Low-Cost AI Ready)

Tanggal update: `2026-04-29`

## Status Ringkas

- `DONE` - Permission Task/Team sudah dipisah dari admin-only gate (navigation + page guard sinkron).
- `DONE` - Guard Task dan Team sudah dipisah (`requireTaskAccess` dan `requireTeamAccess`).
- `PARTIAL` - Hardening ID sudah masuk untuk roles by-id, tetapi user by-id masih bisa ditingkatkan ke validasi UUID eksplisit.
- `OPEN` - Mapping error konflik unik (`409`) untuk endpoint Team masih perlu dirapikan.

## Prioritas Aktif

1. **P1 - Hardening API id/error handling**
- Problem: route user by-id masih validasi minimal (`id?.length`) dan konflik unik belum terpetakan jelas.
- Risiko: response API tidak konsisten, UX admin membingungkan.
- Target hasil:
  - Invalid UUID user id -> `400` dengan pesan jelas.
  - Duplicate username/role -> `409` dengan pesan domain-friendly.
  - Error fallback tetap aman.

## Definition of Done (Remaining Scope)

- Semua change lolos `npm run lint` (atau minimal file terkait bebas error TS/ESLint).
- Uji manual:
  - user by-id endpoint memberi `400` untuk UUID invalid.
  - create/update user/role menampilkan error informatif saat konflik.
- Tidak ada perubahan destructive pada data existing.

## Prompt Siap Pakai Untuk AI Lebih Murah

Gunakan prompt per tahap (jangan sekaligus) supaya model kecil lebih stabil.

### Prompt 1 - API Hardening id + Error Mapping (P1)

```text
Kamu coding agent. Lakukan hardening error handling untuk endpoint Team.

Tujuan:
1) Validasi parameter id numerik di route roles by-id.
2) Validasi parameter user id sebagai UUID di route users by-id dan users profile by-id.
3) Mapping error konflik unik (misalnya username/role duplikat) ke HTTP 409 dengan pesan yang jelas.
4) Pertahankan struktur response error project saat ini.

Batasan:
- Jangan redesign error framework.
- Scope hanya endpoint team user/role terkait.

Deliver:
- Patch kode.
- Daftar endpoint yang berubah.
- Contoh response untuk: invalid id, duplicate data, forbidden.
```

### Prompt 2 - Review Cepat (Setelah Patch)

```text
Lakukan code review fokus regression risk terhadap patch terakhir.
Prioritaskan temuan bug/perilaku salah, bukan style.
Keluarkan hasil dengan urutan severity + file:line + rekomendasi fix singkat.
Jika tidak ada bug kritikal, nyatakan eksplisit dan sebutkan residual risk/testing gap.
```

## Rekomendasi Eksekusi

1. Jalankan Prompt 1.
2. Commit kecil.
3. Jalankan Prompt 2 untuk review final.

Strategi ini menjaga model biaya rendah tetap fokus, konteks kecil, dan output lebih konsisten.
