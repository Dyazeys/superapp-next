import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://superapp:superapp@127.0.0.1:5432/superapp"),
  PRISMA_DATABASE_URL: z.string().min(1).default("postgresql://superapp:superapp@127.0.0.1:5432/superapp"),
  PRISMA_INTROSPECT_SCHEMAS: z.string().min(1).default("auth,channel,product,warehouse,sales,payout,accounting"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(16).default("replace-with-a-long-random-secret"),
  DEMO_ADMIN_EMAIL: z.string().email().default("admin@superapp-next.local"),
  DEMO_ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
});

export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
  PRISMA_INTROSPECT_SCHEMAS: process.env.PRISMA_INTROSPECT_SCHEMAS,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD,
});
