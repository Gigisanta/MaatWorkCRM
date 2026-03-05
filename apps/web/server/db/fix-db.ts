import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Navigate to the root level where .env is located
const envPath = resolve(__dirname, '../../../../.env');
console.log("Loading .env from", envPath);

dotenv.config({ path: envPath });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  
  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS "pipeline_stages" (
      "id" text PRIMARY KEY NOT NULL,
      "organization_id" text NOT NULL,
      "name" text NOT NULL,
      "order" integer DEFAULT 0 NOT NULL,
      "color" text DEFAULT '#6366f1' NOT NULL,
      "is_default" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `;
  console.log("Verified pipeline_stages");

  await sql`
    CREATE TABLE IF NOT EXISTS "deals" (
      "id" text PRIMARY KEY NOT NULL,
      "organization_id" text NOT NULL,
      "contact_id" text NOT NULL,
      "stage_id" text NOT NULL,
      "title" text NOT NULL,
      "value" real DEFAULT 0,
      "probability" integer DEFAULT 50,
      "assigned_to" text,
      "expected_close_date" timestamp,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `;
  console.log("Verified deals");
}

main().catch(console.error);
