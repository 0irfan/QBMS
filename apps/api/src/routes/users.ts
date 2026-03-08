import { Router } from 'express';
import { db } from '../lib/db.js';
import { users } from '@qbms/database';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import type { UserRole } from '@qbms/shared';

export const usersRouter = Router();
usersRouter.use(authMiddleware);
usersRouter.use(requireRoles('super_admin', 'instructor'));

usersRouter.get('/', requireRoles('super_admin'), async (_req, res) => {
  const list = await db
    .select({
      userId: users.userId,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users);
  res.json(list);
});

usersRouter.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (req.user!.role !== 'super_admin' && req.user!.userId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const [user] = await db
    .select({
      userId: users.userId,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.userId, id))
    .limit(1);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

usersRouter.patch(
  '/:id',
  requireRoles('super_admin'),
  auditMiddleware('user.update', 'user'),
  async (req, res) => {
    const { id } = req.params;
    const body = req.body as { name?: string; role?: UserRole; status?: 'active' | 'inactive' };
    const [updated] = await db
      .update(users)
      .set({
        ...(body.name != null && { name: body.name }),
        ...(body.role != null && { role: body.role }),
        ...(body.status != null && { status: body.status }),
        updatedAt: new Date(),
      })
      .where(eq(users.userId, id))
      .returning({ userId: users.userId, name: users.name, email: users.email, role: users.role, status: users.status });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  }
);
