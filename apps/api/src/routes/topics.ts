import { Router } from 'express';
import { db } from '../lib/db.js';
import { topics } from '@qbms/database';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';

export const topicsRouter = Router();
topicsRouter.use(authMiddleware);

topicsRouter.get('/', async (req, res) => {
  const subjectId = req.query.subjectId as string | undefined;
  const list = subjectId
    ? await db.select().from(topics).where(eq(topics.subjectId, subjectId))
    : await db.select().from(topics);
  res.json(list);
});

topicsRouter.get('/:id', async (req, res) => {
  const [row] = await db.select().from(topics).where(eq(topics.topicId, req.params.id)).limit(1);
  if (!row) return res.status(404).json({ error: 'Topic not found' });
  res.json(row);
});

topicsRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('topic.create', 'topic'),
  async (req, res) => {
    const body = req.body as { subjectId: string; topicName: string };
    if (!body.subjectId || !body.topicName) return res.status(400).json({ error: 'subjectId and topicName required' });
    const [created] = await db
      .insert(topics)
      .values({ subjectId: body.subjectId, topicName: body.topicName })
      .returning();
    res.status(201).json(created);
  }
);

topicsRouter.patch(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('topic.update', 'topic'),
  async (req, res) => {
    const body = req.body as { topicName?: string };
    const [updated] = await db
      .update(topics)
      .set({ ...(body.topicName != null && { topicName: body.topicName }) })
      .where(eq(topics.topicId, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Topic not found' });
    res.json(updated);
  }
);

topicsRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('topic.delete', 'topic'),
  async (req, res) => {
    await db.delete(topics).where(eq(topics.topicId, req.params.id));
    res.status(204).send();
  }
);
