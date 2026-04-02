import "server-only";
import { Pool } from "pg";
import { env } from "@/schemas/env";

declare global {
  var __superappNextPool: Pool | undefined;
}

export const pgPool =
  global.__superappNextPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  });

if (env.NODE_ENV !== "production") {
  global.__superappNextPool = pgPool;
}
