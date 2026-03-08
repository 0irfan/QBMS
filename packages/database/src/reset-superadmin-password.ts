/**
 * Reset superadmin password to Admin@123 (or SEED_DEFAULT_PASSWORD).
 * Run: DATABASE_URL=postgresql://qbms:qbms@localhost:5432/qbms npx tsx src/reset-superadmin-password.ts
 */
import { createDb } from './index.js';
import { users } from './schema/index.js';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;
const password = process.env.SEED_DEFAULT_PASSWORD || 'Admin@123';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const db = createDb(connectionString);
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [row] = await db
    .update(users)
    .set({
      passwordHash: hash,
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.email, 'superadmin@qbms.local'))
    .returning({ userId: users.userId });
  if (!row) {
    console.log('No user superadmin@qbms.local found. Run seed first: npx tsx src/seed.ts');
    process.exit(1);
  }
  console.log('Password reset for superadmin@qbms.local. Use:', password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
