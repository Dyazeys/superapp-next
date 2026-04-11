# Local Setup

This project supports two local development modes on both Windows and Mac:

- remote VPS database through an SSH tunnel
- fully local Docker PostgreSQL

The current repo default in `.env.example` is the VPS tunnel mode on `127.0.0.1:55432`.

## First-time setup

1. Install Node.js 20+.
2. Install Git.
3. Install OpenSSH client.
   Mac: `ssh` is already available by default.
4. Copy `.env.example` to `.env`.
5. Set a unique `NEXTAUTH_SECRET` in `.env`.
6. Install app dependencies and generate Prisma client:

```bash
npm install
npm run prisma:generate
```

## Option A: Use the VPS database through SSH tunnel

This is the closest setup to the current Windows machine.

### `.env` values for tunnel mode

The repo default is already set for this mode:

- Host: `127.0.0.1`
- Port: `55432`
- Database: `superapp_db`
- Username: `superapp_app`
- Password: set in your local `.env`

### SSH key

Expected default key path:

- Mac/Linux: `~/.ssh/id_ed25519`
- Windows PowerShell helper: `$HOME/.ssh/id_ed25519`

If your Mac uses a different key path, export this before opening the tunnel:

```bash
export DB_TUNNEL_KEY_PATH="$HOME/.ssh/your_key_name"
```

### Open the tunnel

The command is now cross-platform:

```bash
npm run db:tunnel
```

Optional environment overrides:

- `DB_TUNNEL_LOCAL_PORT`
- `DB_TUNNEL_REMOTE_HOST`
- `DB_TUNNEL_REMOTE_USER`
- `DB_TUNNEL_REMOTE_DB_HOST`
- `DB_TUNNEL_REMOTE_DB_PORT`
- `DB_TUNNEL_KEY_PATH`

Example on Mac:

```bash
DB_TUNNEL_KEY_PATH="$HOME/.ssh/id_ed25519" npm run db:tunnel
```

Keep that terminal open while developing.

### Run the app against the VPS database

In a second terminal:

```bash
npm run dev
```

## Option B: Use a fully local Docker database

Use this only if you want an isolated local DB instead of the VPS DB.

1. Override `.env` so it points to local Postgres:

```env
DATABASE_URL="postgresql://superapp:superapp@127.0.0.1:5432/superapp"
PRISMA_DATABASE_URL="postgresql://superapp:superapp@127.0.0.1:5432/superapp"
```

2. Start the database:

```bash
docker compose up -d postgres
```

3. Run the app:

```bash
npm run dev
```

## Mac migration checklist

When moving from the current Windows machine to a Mac and you want the same behavior:

1. Clone the repo on the Mac.
2. Copy `.env` securely from the Windows machine to the Mac.
3. Ensure the SSH private key used for the VPS tunnel exists on the Mac.
4. Run `npm install`.
5. Run `npm run prisma:generate`.
6. Start the DB tunnel with `npm run db:tunnel`.
7. Start the app with `npm run dev`.

If all of the above match, the Mac setup will behave the same as the current Windows setup because both use the same repo, the same `.env`, and the same VPS database.

## Backup and restore (Docker + VPS tunnel fallback)

PowerShell scripts now support two modes:

- Docker mode (if `superapp-postgres` container is running)
- SSH fallback mode (if Docker is unavailable, uses VPS PostgreSQL via `ssh`)

### Backup

Windows PowerShell:

```powershell
.\scripts\db-backup.ps1
```

Mac/Linux:

```bash
bash scripts/db-backup.sh
```

Each command creates a timestamped `.sql` file under `backups/`.
If Docker is down, the script automatically falls back to SSH mode (requires `~/.ssh/id_ed25519` by default).

### Restore

1. Copy the chosen SQL backup file into the new machine's `backups/` folder.
2. For Docker mode, start the local database:

```bash
docker compose up -d postgres
```

3. Restore the backup file.

Windows PowerShell:

```powershell
.\scripts\db-restore.ps1 -InputFile backups\superapp-YYYYMMDD-HHMMSS.sql
```

Mac/Linux:

```bash
bash scripts/db-restore.sh backups/superapp-YYYYMMDD-HHMMSS.sql
```

For PowerShell on tunnel/VPS mode, the same command works and will auto-fallback to SSH if Docker is not available.

## Notes

- `.env` is local-only and should not be committed.
- `backups/` is local-only and should not be committed.
- PowerShell backup/restore scripts can use Docker or SSH fallback automatically.
- If you use tunnel mode, the app depends on the SSH tunnel terminal remaining open.
