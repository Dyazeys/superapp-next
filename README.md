# SuperApp Next

Parallel Next.js ERP project scaffolded in `E:\deploy\superapp-next`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma + PostgreSQL
- NextAuth
- React Hook Form + Zod
- TanStack React Query + Table
- Recharts
- Zustand
- Sonner

## Quick start

```bash
npm install
npm run prisma:generate
npm run dev
```

## Structure

- `app/(app)` application shell routes
- `components/layout` shell and page chrome
- `components/patterns` CRUD dialog, table, and inline edit foundations
- `features/customers` example ERP module
- `lib` shared config, auth, db, formatting, and validators
- `prisma` PostgreSQL schema and Prisma config
- `store` Zustand client state
