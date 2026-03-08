import { Router } from 'express';
import { db } from '../lib/db.js';
import { questions, questionOptions, topics } from '@qbms/database';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { createQuestionSchema, updateQuestionSchema, questionSearchSchema } from '@qbms/shared';

export const questionsRouter = Router();
questionsRouter.use(authMiddleware);

questionsRouter.get('/', async (req, res) => {
  const parsed = questionSearchSchema.safeParse({
    ...req.query,
    cursor: req.query.cursor,
    limit: req.query.limit ?? 20,
  });
  const opts = parsed.success ? parsed.data : { limit: 20 as number };
  const limit = opts.limit + 1;
  let q = db
    .select()
    .from(questions)
    .orderBy(desc(questions.createdAt))
    .limit(limit);
  if (opts.topicId) q = q.where(eq(questions.topicId, opts.topicId)) as typeof q;
  if (opts.type) q = q.where(eq(questions.type, opts.type)) as typeof q;
  if (opts.difficulty) q = q.where(eq(questions.difficulty, opts.difficulty)) as typeof q;
  if (opts.createdBy) q = q.where(eq(questions.createdBy, opts.createdBy)) as typeof q;
  const rows = await q;
  const hasMore = rows.length > opts.limit;
  const data = rows.slice(0, opts.limit);
  const nextCursor = hasMore ? data[data.length - 1]?.questionId : null;
  res.json({ data, nextCursor, hasMore });
});

questionsRouter.get('/:id', async (req, res) => {
  const [row] = await db.select().from(questions).where(eq(questions.questionId, req.params.id)).limit(1);
  if (!row) return res.status(404).json({ error: 'Question not found' });
  const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, row.questionId));
  res.json({ ...row, options });
});

questionsRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('question.create', 'question'),
  async (req: AuthRequest, res) => {
    const parsed = createQuestionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { topicId, questionText, type, difficulty, marks, options } = parsed.data;
    const [created] = await db
      .insert(questions)
      .values({
        topicId,
        questionText,
        type,
        difficulty,
        marks,
        createdBy: req.user!.userId,
      })
      .returning();
    if (options?.length && type === 'mcq') {
      await db.insert(questionOptions).values(
        options.map((o: { optionText: string; isCorrect: boolean }) => ({
          questionId: created!.questionId,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        }))
      );
    }
    res.status(201).json(created);
  }
);

questionsRouter.patch(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('question.update', 'question'),
  async (req: AuthRequest, res) => {
    const parsed = updateQuestionSchema.safeParse({ ...req.body, questionId: req.params.id });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { questionText, type, difficulty, marks, options } = parsed.data;
    const [existing] = await db.select().from(questions).where(eq(questions.questionId, req.params.id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    const [updated] = await db
      .update(questions)
      .set({
        ...(questionText != null && { questionText }),
        ...(type != null && { type }),
        ...(difficulty != null && { difficulty }),
        ...(marks != null && { marks }),
        version: existing.version + 1,
      })
      .where(eq(questions.questionId, req.params.id))
      .returning();
    if (options?.length && (updated?.type ?? existing.type) === 'mcq') {
      await db.delete(questionOptions).where(eq(questionOptions.questionId, req.params.id));
      await db.insert(questionOptions).values(
        options.map((o: { optionText: string; isCorrect: boolean }) => ({
          questionId: req.params.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        }))
      );
    }
    res.json(updated);
  }
);

questionsRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('question.delete', 'question'),
  async (req, res) => {
    await db.delete(questions).where(eq(questions.questionId, req.params.id));
    res.status(204).send();
  }
);
