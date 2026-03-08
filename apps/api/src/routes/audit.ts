import { Router } from 'express';
import { db } from '../lib/db.js';
import { auditLogs } from '@qbms/database';
import { desc } from 'drizzle-orm';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

export const auditRouter = Router();
auditRouter.use(authMiddleware);
auditRouter.use(requireRoles('super_admin'));

auditRouter.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const list = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
  res.json(list);
});
