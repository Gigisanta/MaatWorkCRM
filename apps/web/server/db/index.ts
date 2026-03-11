// ============================================================
// MaatWork CRM — Database Connection (Neon PostgreSQL)
// ============================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadEnv } from "vite";
import { logDB, logError, logger } from "~/lib/logger";

const loadEnvFile = (mode: string) => {
  const cwd = process.cwd();
  const isAppsWeb = cwd.endsWith("/apps/web") || cwd.endsWith("\\apps\\web");
  const envPath = isAppsWeb ? path.join(cwd, ".env") : path.join(cwd, "apps/web/.env");

  try {
    const envConfig = loadEnv(mode, cwd, "");
    Object.assign(process.env, envConfig);
  } catch {
    // Ignore env loading errors
  }
};

loadEnvFile(process.env.NODE_ENV || "development");

let pool: Pool | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;

    logDB("connect", { hasUrl: !!connectionString });

    if (!connectionString) {
      logger.error({ context: "db" }, "DATABASE_URL not set");
      return null;
    }

    try {
      logDB("create-pool", {
        connectionString: `${connectionString.substring(0, 50)}...`,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
      pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
      _db = drizzle(pool);
      logDB("init-success", { hasPool: !!pool });
    } catch (error) {
      logError(error, "db-init");
      return null;
    }
  }
  return _db;
}

export const db = getDb();
export type Database = typeof db;
