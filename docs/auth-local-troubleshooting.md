# Auth Local Troubleshooting

Tanggal: `2026-04-13`

Panduan cepat jika login lokal gagal (`/login` -> `Email atau password tidak valid`).

## Gejala Umum

1. `POST /api/auth/callback/credentials` mengembalikan `401`.
2. Session tetap kosong (`GET /api/auth/session` -> `{}`).

## Checklist Diagnostik

1. Pastikan server aktif di port yang benar:
- `localhost:3000`
2. Pastikan tidak ada stale `next dev` process.
3. Pastikan `.env` terbaru sudah terbaca.
4. Pastikan email/password sesuai `DEMO_ADMIN_EMAIL` dan `DEMO_ADMIN_PASSWORD`.

## Tindakan Perbaikan

1. Stop semua process `next dev` lama.
2. Start ulang `npm run dev`.
3. Jika masih gagal:
- ganti sementara `DEMO_ADMIN_PASSWORD` ke string parser-safe (tanpa karakter yang rawan parsing shell/env).
4. Retry login setelah restart server.

## Hardening yang Sudah Ada

Di auth credentials:
- Email dibandingkan dengan `trim().toLowerCase()`.
- Password dibandingkan dengan `trim()`.

## Catatan Operasional

- Jangan simpan plaintext credential di dokumen repo.
- Simpan nilai final di password manager/vault tim.
