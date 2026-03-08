import { Router } from 'express';
import { db } from '../lib/db.js';
import {
  examAttempts,
  responses,
  results,
  questionOptions,
  questions,
  exams,
} from '@qbms/database';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { redis, REDIS_KEYS } from '../lib/redis.js';

export const attemptsRouter = Router();
attemptsRouter.use(authMiddleware);

attemptsRouter.get('/', async (req: AuthRequest, res) => {
  const examId = req.query.examId as string | undefined;
  if (req.user!.role === 'student') {
    const list = await db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.studentId, req.user!.userId),
          ...(examId ? [eq(examAttempts.examId, examId)] : [])
        )
      );
    return res.json(list);
  }
  const list = examId
    ? await db.select().from(examAttempts).where(eq(examAttempts.examId, examId))
    : await db.select().from(examAttempts);
  res.json(list);
});

attemptsRouter.post('/start', async (req: AuthRequest, res) => {
  const { examId } = req.body as { examId: string };
  if (!examId) return res.status(400).json({ error: 'examId required' });
  const [exam] = await db.select().from(exams).where(eq(exams.examId, examId)).limit(1);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  if (exam.status !== 'active') return res.status(400).json({ error: 'Exam is not active' });
  const existing = await db
    .select()
    .from(examAttempts)
    .where(
      and(
        eq(examAttempts.examId, examId),
        eq(examAttempts.studentId, req.user!.userId),
        eq(examAttempts.status, 'in_progress')
      )
    )
    .limit(1);
  if (existing.length) return res.json(existing[0]);
  const [attempt] = await db
    .insert(examAttempts)
    .values({
      examId,
      studentId: req.user!.userId,
      status: 'in_progress',
    })
    .returning();
  const endsAt = Date.now() + exam.timeLimit * 60 * 1000;
  await redis.setex(REDIS_KEYS.examTimer(attempt!.attemptId), exam.timeLimit * 60, String(endsAt));
  res.status(201).json(attempt);
});

attemptsRouter.get('/:id', async (req: AuthRequest, res) => {
  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.attemptId, req.params.id))
    .limit(1);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (req.user!.role === 'student' && attempt.studentId !== req.user!.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const resp = await db.select().from(responses).where(eq(responses.attemptId, attempt.attemptId));
  const responsesWithQuestion = await Promise.all(
    resp.map(async (r) => {
      const [q] = await db.select().from(questions).where(eq(questions.questionId, r.questionId)).limit(1);
      const options =
        q?.type === 'mcq'
          ? await db.select().from(questionOptions).where(eq(questionOptions.questionId, r.questionId))
          : [];
      return {
        ...r,
        questionText: q?.questionText ?? '',
        options: options.map((o) => ({ optionId: o.optionId, optionText: o.optionText, isCorrect: o.isCorrect })),
      };
    })
  );
  const [result] = await db.select().from(results).where(eq(results.attemptId, attempt.attemptId)).limit(1);
  res.json({ ...attempt, responses: responsesWithQuestion, result: result ?? null });
});

attemptsRouter.post('/:id/responses', async (req: AuthRequest, res) => {
  const { questionId, answerText, selectedOptionId } = req.body as {
    questionId: string;
    answerText?: string;
    selectedOptionId?: string;
  };
  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.attemptId, req.params.id))
    .limit(1);
  if (!attempt || attempt.studentId !== req.user!.userId || attempt.status !== 'in_progress') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const key = REDIS_KEYS.attemptResponse(attempt.attemptId);
  await redis.hset(key, questionId, JSON.stringify({ answerText, selectedOptionId }));
  const existing = await db
    .select()
    .from(responses)
    .where(
      and(
        eq(responses.attemptId, req.params.id),
        eq(responses.questionId, questionId)
      )
    )
    .limit(1);
  if (existing.length) {
    await db
      .update(responses)
      .set({
        answerText: answerText ?? existing[0].answerText,
        selectedOptionId: selectedOptionId ?? existing[0].selectedOptionId,
      })
      .where(eq(responses.responseId, existing[0].responseId));
  } else {
    await db.insert(responses).values({
      attemptId: req.params.id,
      questionId,
      answerText: answerText ?? null,
      selectedOptionId: selectedOptionId ?? null,
    });
  }
  res.json({ ok: true });
});

attemptsRouter.post('/:id/submit', async (req: AuthRequest, res) => {
  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.attemptId, req.params.id))
    .limit(1);
  if (!attempt || attempt.studentId !== req.user!.userId) return res.status(403).json({ error: 'Forbidden' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Already submitted' });
  const key = REDIS_KEYS.attemptResponse(attempt.attemptId);
  const saved = await redis.hgetall(key);
  for (const [questionId, val] of Object.entries(saved || {})) {
    const { answerText, selectedOptionId } = JSON.parse(val);
    const existing = await db
      .select()
      .from(responses)
      .where(
        and(eq(responses.attemptId, req.params.id), eq(responses.questionId, questionId))
      )
      .limit(1);
    if (existing.length) {
      await db
        .update(responses)
        .set({ answerText, selectedOptionId })
        .where(eq(responses.responseId, existing[0].responseId));
    } else {
      await db.insert(responses).values({
        attemptId: req.params.id,
        questionId,
        answerText: answerText ?? null,
        selectedOptionId: selectedOptionId ?? null,
      });
    }
  }
  await redis.del(key);
  const respList = await db.select().from(responses).where(eq(responses.attemptId, req.params.id));
  let totalScore = 0;
  for (const r of respList) {
    const [q] = await db.select().from(questions).where(eq(questions.questionId, r.questionId)).limit(1);
    const questionMarks = q?.marks ?? 0;
    if (r.selectedOptionId) {
      const [opt] = await db
        .select()
        .from(questionOptions)
        .where(
          and(
            eq(questionOptions.optionId, r.selectedOptionId),
            eq(questionOptions.questionId, r.questionId)
          )
        )
        .limit(1);
      const isCorrect = opt?.isCorrect ?? false;
      const marksObtained = isCorrect ? questionMarks : 0;
      totalScore += marksObtained;
      await db
        .update(responses)
        .set({ isCorrect, marksObtained })
        .where(eq(responses.responseId, r.responseId));
    }
  }
  const [exam] = await db.select().from(exams).where(eq(exams.examId, attempt.examId)).limit(1);
  const percentage = exam ? (totalScore / exam.totalMarks) * 100 : 0;
  let grade = 'F';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';
  await db
    .update(examAttempts)
    .set({ status: 'submitted', submittedAt: new Date() })
    .where(eq(examAttempts.attemptId, req.params.id));
  await db.insert(results).values({
    attemptId: req.params.id,
    totalScore,
    percentage: String(percentage.toFixed(2)),
    grade,
  });
  res.json({ totalScore, percentage, grade });
});

attemptsRouter.get('/:id/result', async (req: AuthRequest, res) => {
  const [result] = await db
    .select()
    .from(results)
    .where(eq(results.attemptId, req.params.id))
    .limit(1);
  if (!result) return res.status(404).json({ error: 'Result not found' });
  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.attemptId, req.params.id))
    .limit(1);
  if (req.user!.role === 'student' && attempt?.studentId !== req.user!.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(result);
});
