# Credential Registry (SuperApp Next)

Tanggal: `2026-04-13`

## Tujuan

Dokumen ini jadi satu pintu referensi untuk data credential dan setting infrastruktur penting.

Aturan wajib:
- Jangan simpan secret plaintext di repository Git.
- Simpan secret di password manager/secret vault tim.
- Di repo ini, catat hanya lokasi secret + owner + kebijakan rotasi.

## 1) Auth & App Secrets

| Item | Dipakai untuk | Lokasi penyimpanan secret | Owner | Rotasi |
| --- | --- | --- | --- | --- |
| `NEXTAUTH_SECRET` | Sign/encrypt session auth | Vault: `superapp-next/prod/NEXTAUTH_SECRET` | DevOps | 90 hari / incident |
| `DEMO_ADMIN_EMAIL` | Login admin demo/internal | Vault: `superapp-next/prod/DEMO_ADMIN_EMAIL` | Product Owner | Saat pergantian akun |
| `DEMO_ADMIN_PASSWORD` | Login admin demo/internal | Vault: `superapp-next/prod/DEMO_ADMIN_PASSWORD` | Product Owner + DevOps | 30-90 hari / incident |

## 2) Database Credentials

| Item | Dipakai untuk | Lokasi penyimpanan secret | Owner | Rotasi |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Koneksi runtime aplikasi | Vault: `superapp-next/prod/DATABASE_URL` | DevOps | 90 hari / incident |
| `PRISMA_DATABASE_URL` | Koneksi Prisma tooling | Vault: `superapp-next/prod/PRISMA_DATABASE_URL` | DevOps | 90 hari / incident |
| PostgreSQL app user password | Credential user DB aplikasi (`superapp_app`) | Vault: `vps/postgres/superapp_app` | DBA/DevOps | 90 hari / incident |

## 3) VPS & SSH Settings

Setting non-secret berikut boleh didokumentasikan di repo:

- VPS host: `217.15.162.20`
- VPS SSH user: `opsadmin`
- App path: `/opt/superapp-next`
- App domain: `https://app.ridersinc.id`
- App container: `superapp-next-app`
- App internal port: `3000`
- Nginx config: `/etc/nginx/sites-available/app.ridersinc.id.conf`

Credential SSH (secret) jangan di repo:
- SSH private key path default (lokal): `~/.ssh/id_ed25519`
- Passphrase key (jika ada): simpan di password manager
- Jika pakai password login SSH: simpan di password manager (disarankan disable password login di server)

## 4) DB Tunnel Settings

Referensi dari script tunnel:
- `DB_TUNNEL_LOCAL_PORT=55432`
- `DB_TUNNEL_REMOTE_HOST=217.15.162.20`
- `DB_TUNNEL_REMOTE_USER=opsadmin`
- `DB_TUNNEL_REMOTE_DB_HOST=127.0.0.1`
- `DB_TUNNEL_REMOTE_DB_PORT=5432`
- `DB_TUNNEL_KEY_PATH=~/.ssh/id_ed25519`

## 5) Lokasi Operasional Harian

- Local runtime env: file `.env` (lokal, tidak di-commit)
- Template env: `.env.example` (tanpa secret nyata)
- Setup guide: `docs/local-setup.md`
- Live ops guide: `docs/live-operations-cheatsheet.md`

## 6) Checklist Saat Rotasi Secret

1. Rotasi nilai di secret vault terlebih dahulu.
2. Update `.env` lokal atau environment production (tanpa commit secret).
3. Restart app/process yang membaca secret.
4. Jalankan verifikasi:
   - `npm run build`
   - `npm run go-live:check`
5. Catat tanggal rotasi + PIC di ticket internal.

## 7) Catatan Keamanan

- Jika ada secret terlanjur tertulis di dokumen Git, anggap bocor:
  1. rotasi secret segera,
  2. update semua environment,
  3. hapus/replace nilai plaintext dari dokumen,
  4. dokumentasikan incident.
