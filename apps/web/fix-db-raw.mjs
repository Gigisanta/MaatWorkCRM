import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_PkW1wNbSae8X@ep-holy-shadow-ac20pwz6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require");

async function main() {
  console.log('creating pipeline_stages');
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
  
  console.log('creating deals');
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
  console.log('done!');
}
main().catch(console.error);
