import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_PkW1wNbSae8X@ep-holy-shadow-ac20pwz6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require");

async function main() {
  console.log('Dropping public schema...');
  await sql`DROP SCHEMA public CASCADE;`;
  console.log('Creating public schema...');
  await sql`CREATE SCHEMA public;`;
  console.log('Done reseting schema!');
}

main().catch(console.error);
