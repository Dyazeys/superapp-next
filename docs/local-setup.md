# Local Setup

This project keeps local development portable between Windows and Mac by using the same Docker PostgreSQL container name, credentials, and backup workflow on every machine.

## First-time setup

1. Install Docker Desktop and Node.js.
2. Copy `.env.example` to `.env`.
3. Review `.env` and set a unique `NEXTAUTH_SECRET` for your machine.
4. Start the local database:

```bash
docker compose up -d postgres
```

5. Install app dependencies and generate Prisma client:

```bash
npm install
npm run prisma:generate
```

## Local environment

The default local database values are:

- Host: `127.0.0.1`
- Port: `5432`
- Database: `superapp`
- Username: `superapp`
- Password: `superapp`
- Container: `superapp-postgres`

The Docker volume is named `superapp-postgres-data` so the database persists locally until you intentionally remove that volume.

## Run the app

After the database is running and `.env` exists:

```bash
npm run dev
```

## Backup before switching devices

Create a SQL backup into `backups/` before moving to another machine.

Windows PowerShell:

```powershell
.\scripts\db-backup.ps1
```

Mac/Linux:

```bash
bash scripts/db-backup.sh
```

Each command creates a timestamped `.sql` file under `backups/`.

## Restore on another device

1. Copy the chosen SQL backup file into the new machine's `backups/` folder.
2. Start the local database:

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

4. Start the app:

```bash
npm run dev
```

## Notes

- `.env` is local-only and should not be committed.
- `backups/` is local-only and should not be committed.
- The restore scripts load a full SQL dump into the local Docker database, so use them intentionally against your local development container.
