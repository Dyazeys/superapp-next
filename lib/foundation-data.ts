export const FOUNDATION_PILLARS = [
  {
    title: "Runtime providers",
    description: "React Query, Sonner, and NextAuth session context are mounted once in the root layout.",
    status: "Installed",
  },
  {
    title: "Database access",
    description: "Prisma 7 and direct PostgreSQL pool helpers are isolated under db adapters.",
    status: "Ready",
  },
  {
    title: "UI primitives",
    description: "Page shells, tables, modal forms, field wrappers, badges, and empty states are reusable.",
    status: "Ready",
  },
];

export const FOUNDATION_CHECKLIST = [
  ["App Router shell", "done"],
  ["Typed env loading", "done"],
  ["NextAuth base", "done"],
  ["Prisma base", "done"],
  ["Module migration staging", "next"],
];

export const FOUNDATION_TABLE_ROWS = [
  {
    area: "Providers",
    detail: "AppProviders composes SessionProvider, QueryClientProvider, and Toaster.",
    state: "ready",
  },
  {
    area: "Shell",
    detail: "Left icon rail, secondary sidebar, compact header, and content workspace.",
    state: "ready",
  },
  {
    area: "Forms",
    detail: "Modal form shell and field wrapper for consistent validation presentation.",
    state: "ready",
  },
  {
    area: "Data",
    detail: "TanStack table wrapper prepared for server actions or API-fed datasets.",
    state: "ready",
  },
];
