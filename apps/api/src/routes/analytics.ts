import { Router } from 'express';
import { db } from '../lib/db.js';
import { examAttempts, results, questions, exams } from '@qbms/database';
import { eq, sql } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

analyticsRouter.get('/instructor', requireRoles('super_admin', 'instructor'), async (req: AuthRequest, res) => {
  const classId = req.query.classId as string | undefined;
  const examList = classId
    ? await db.select().from(exams).where(eq(exams.classId, classId))
    : await db.select().from(exams);
  const examIds = examList.map((e: { examId: string }) => e.examId);
  const attempts = examIds.length
    ? await db.select().from(examAttempts).where(eq(examAttempts.examId, examIds[0]))
    : [];
  const resultList = await db.select().from(results);
  res.json({
    totalExams: examList.length,
    totalAttempts: attempts.length,
    results: resultList.slice(0, 50),
  });
});

analyticsRouter.get('/student', async (req: AuthRequest, res) => {
  const attempts = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.studentId, req.user!.userId));
  const resultList = await db.select().from(results);
  const myResults = resultList.filter((r: { attemptId: string }) =>
    attempts.some((a: { attemptId: string }) => a.attemptId === r.attemptId)
  );
  res.json({ attempts: attempts.length, results: myResults });
});

analyticsRouter.get('/admin', requireRoles('super_admin'), async (_req, res) => {
  const examsCount = await db.select().from(exams);
  const attemptsCount = await db.select().from(examAttempts);
  res.json({
    totalExams: examsCount.length,
    totalAttempts: attemptsCount.length,
  });
});
