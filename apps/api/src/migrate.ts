import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'path';

const { Pool } = pg;

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  const migrationsFolder =
    process.env.DRIZZLE_MIGRATIONS_FOLDER ||
    path.join(process.cwd(), 'drizzle');
  await migrate(db, { migrationsFolder });
  await pool.end();
  console.log('Migrations completed');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
