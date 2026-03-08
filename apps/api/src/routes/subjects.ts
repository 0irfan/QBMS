import { Router } from 'express';
import { db } from '../lib/db.js';
import { subjects } from '@qbms/database';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';

export const subjectsRouter = Router();
subjectsRouter.use(authMiddleware);

subjectsRouter.get('/', async (_req, res) => {
  const list = await db.select().from(subjects);
  res.json(list);
});

subjectsRouter.get('/:id', async (req, res) => {
  const [row] = await db.select().from(subjects).where(eq(subjects.subjectId, req.params.id)).limit(1);
  if (!row) return res.status(404).json({ error: 'Subject not found' });
  res.json(row);
});

subjectsRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('subject.create', 'subject'),
  async (req: AuthRequest, res) => {
    const body = req.body as { subjectName: string; description?: string };
    if (!body.subjectName) return res.status(400).json({ error: 'subjectName required' });
    const [created] = await db.insert(subjects).values({
      subjectName: body.subjectName,
      description: body.description ?? null,
    }).returning();
    res.status(201).json(created);
  }
);

subjectsRouter.patch(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('subject.update', 'subject'),
  async (req, res) => {
    const body = req.body as { subjectName?: string; description?: string };
    const [updated] = await db
      .update(subjects)
      .set({
        ...(body.subjectName != null && { subjectName: body.subjectName }),
        ...(body.description !== undefined && { description: body.description }),
      })
      .where(eq(subjects.subjectId, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Subject not found' });
    res.json(updated);
  }
);

subjectsRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('subject.delete', 'subject'),
  async (req, res) => {
    const result = await db.delete(subjects).where(eq(subjects.subjectId, req.params.id));
    res.status(204).send();
  }
);
