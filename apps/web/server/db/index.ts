// ============================================================
// MaatWork CRM — Database Connection (Neon PostgreSQL)
// ============================================================

import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { logDB, logError, logger } from "~/lib/logger";

const loadEnvFile = () => {
  try {
    const envFile = readFileSync(".env", "utf-8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    }
  } catch (e) {
    // Ignore if .env doesn't exist
  }
};

loadEnvFile();

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
