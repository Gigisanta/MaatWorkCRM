import type { Config } from "drizzle-kit";

export default {
  schema: "./server/db/schema/index.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/maatwork",
  },
} satisfies Config;
