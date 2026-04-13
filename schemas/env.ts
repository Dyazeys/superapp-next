import "server-only";
import { z } from "zod";

const nodeEnv = z.enum(["development", "test", "production"]).default("development").parse(process.env.NODE_ENV);
const isProduction = nodeEnv === "production";
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const enforceRequiredProdEnv = isProduction && !isProductionBuild;

const localDbDefault = "postgresql://superapp:superapp@127.0.0.1:5432/superapp";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: enforceRequiredProdEnv ? z.string().min(1) : z.string().min(1).default(localDbDefault),
  PRISMA_DATABASE_URL: enforceRequiredProdEnv ? z.string().min(1) : z.string().min(1).default(localDbDefault),
  PRISMA_INTROSPECT_SCHEMAS: z.string().min(1).default("auth,channel,product,warehouse,sales,payout,accounting"),
  NEXTAUTH_URL: enforceRequiredProdEnv ? z.string().url() : z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: enforceRequiredProdEnv
    ? z.string().min(32)
    : z.string().min(16).default("replace-with-a-long-random-secret"),
  DEMO_ADMIN_EMAIL: enforceRequiredProdEnv ? z.string().email() : z.string().email().default("ops-auth@superapp.internal"),
  DEMO_ADMIN_PASSWORD: enforceRequiredProdEnv ? z.string().min(16) : z.string().min(8).default("DevOnly-Replace-Me-123!"),
});

const parsedEnv = serverEnvSchema.parse({
  NODE_ENV: nodeEnv,
  DATABASE_URL: process.env.DATABASE_URL,
  PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
  PRISMA_INTROSPECT_SCHEMAS: process.env.PRISMA_INTROSPECT_SCHEMAS,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD,
});

if (isProduction) {
  const blockedDemoPasswords = new Set(["ChangeMe123!", "DevOnly-Replace-Me-123!"]);
  const blockedDemoEmails = new Set(["admin@superapp-next.local", "ops-auth@superapp.internal"]);

  if (blockedDemoPasswords.has(parsedEnv.DEMO_ADMIN_PASSWORD)) {
    throw new Error("DEMO_ADMIN_PASSWORD must be rotated in production.");
  }

  if (blockedDemoEmails.has(parsedEnv.DEMO_ADMIN_EMAIL)) {
    throw new Error("DEMO_ADMIN_EMAIL default value is not allowed in production.");
  }
}

export const env = parsedEnv;
