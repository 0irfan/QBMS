/**
 * Create or reset superadmin in the DB (use inside API container).
 * Run: docker exec qbms-api node scripts/seed-superadmin.cjs
 */
const { createDb } = require('../packages/database/dist/index.js');
const { users } = require('../packages/database/dist/schema/index.js');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const db = createDb(DATABASE_URL);
const hash = bcrypt.hashSync(process.env.SEED_DEFAULT_PASSWORD || 'Admin@123', 12);

(async () => {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'superadmin@qbms.local'))
    .limit(1);
  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash: hash,
        status: 'active',
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.userId, existing.userId));
    console.log('Updated superadmin password.');
  } else {
    await db.insert(users).values({
      name: 'Super Admin',
      email: 'superadmin@qbms.local',
      passwordHash: hash,
      role: 'super_admin',
      status: 'active',
    });
    console.log('Created superadmin.');
  }
  console.log('Login: superadmin@qbms.local / Admin@123');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
