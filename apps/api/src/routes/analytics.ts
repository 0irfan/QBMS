import { Router } from 'express';
import { db } from '../lib/db.js';
import { examAttempts, results, questions, exams, subjects, classes } from '@qbms/database';
import { eq, sql } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

// Dashboard stats for instructors
analyticsRouter.get('/dashboard-stats', requireRoles('super_admin', 'instructor'), async (req: AuthRequest, res) => {
  try {
    const [subjectsResult] = await db.select({ count: sql<number>`count(*)` }).from(subjects);
    const [questionsResult] = await db.select({ count: sql<number>`count(*)` }).from(questions);
    const [examsResult] = await db.select({ count: sql<number>`count(*)` }).from(exams);
    const [classesResult] = await db.select({ count: sql<number>`count(*)` }).from(classes);
    
    res.json({
      totalSubjects: Number(subjectsResult?.count || 0),
      totalQuestions: Number(questionsResult?.count || 0),
      totalExams: Number(examsResult?.count || 0),
      totalClasses: Number(classesResult?.count || 0),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

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
