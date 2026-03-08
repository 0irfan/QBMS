import { Router } from 'express';
import { db } from '../lib/db.js';
import { exams, examQuestions, classes, classEnrollments, questions, questionOptions } from '@qbms/database';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';

export const examsRouter = Router();
examsRouter.use(authMiddleware);

examsRouter.get('/', async (req: AuthRequest, res) => {
  const classId = req.query.classId as string | undefined;
  if (req.user!.role === 'student') {
    const enrollments = await db
      .select({ classId: classEnrollments.classId })
      .from(classEnrollments)
      .where(eq(classEnrollments.studentId, req.user!.userId));
    const classIds = enrollments.map((e: { classId: string }) => e.classId);
    if (classIds.length === 0) return res.json([]);
    const list = await db.select().from(exams).where(eq(exams.classId, classIds[0]));
    const rest = await Promise.all(
      classIds.slice(1).map((id: string) => db.select().from(exams).where(eq(exams.classId, id)))
    );
    return res.json([...list, ...rest.flat()]);
  }
  if (classId) {
    const list = await db.select().from(exams).where(eq(exams.classId, classId));
    return res.json(list);
  }
  const list = await db.select().from(exams);
  res.json(list);
});

examsRouter.get('/:id', async (req, res) => {
  const [row] = await db.select().from(exams).where(eq(exams.examId, req.params.id)).limit(1);
  if (!row) return res.status(404).json({ error: 'Exam not found' });
  const eqs = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, row.examId))
    .orderBy(examQuestions.questionOrder);
  res.json({ ...row, questions: eqs });
});

/** Exam with full question text and options (for take-exam view) */
examsRouter.get('/:id/with-questions', async (req: AuthRequest, res) => {
  const [row] = await db.select().from(exams).where(eq(exams.examId, req.params.id)).limit(1);
  if (!row) return res.status(404).json({ error: 'Exam not found' });
  if (req.user!.role === 'student') {
    const [enrolled] = await db
      .select()
      .from(classEnrollments)
      .where(and(eq(classEnrollments.classId, row.classId), eq(classEnrollments.studentId, req.user!.userId)))
      .limit(1);
    if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this class' });
  }
  const eqs = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, row.examId))
    .orderBy(examQuestions.questionOrder);
  const withDetails = await Promise.all(
    eqs.map(async (eqRow) => {
      const [q] = await db.select().from(questions).where(eq(questions.questionId, eqRow.questionId)).limit(1);
      if (!q) return { ...eqRow, questionText: '', type: 'short', marks: 0, options: [] };
      const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, q.questionId));
      return {
        examQuestionId: eqRow.examQuestionId,
        questionId: q.questionId,
        questionOrder: eqRow.questionOrder,
        questionText: q.questionText,
        type: q.type,
        marks: q.marks,
        options: options.map((o) => ({ optionId: o.optionId, optionText: o.optionText, isCorrect: o.isCorrect })),
      };
    })
  );
  res.json({ ...row, questions: withDetails });
});

examsRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('exam.create', 'exam'),
  async (req: AuthRequest, res) => {
    const body = req.body as {
      classId: string;
      title: string;
      totalMarks: number;
      timeLimit: number;
      scheduledAt?: string;
      questionIds?: string[];
    };
    if (!body.classId || !body.title || body.totalMarks == null || body.timeLimit == null) {
      return res.status(400).json({ error: 'classId, title, totalMarks, timeLimit required' });
    }
    const [created] = await db
      .insert(exams)
      .values({
        classId: body.classId,
        title: body.title,
        totalMarks: body.totalMarks,
        timeLimit: body.timeLimit,
        status: 'draft',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      })
      .returning();
    if (body.questionIds?.length) {
      await db.insert(examQuestions).values(
        body.questionIds.map((questionId, i) => ({
          examId: created!.examId,
          questionId,
          questionOrder: i,
        }))
      );
    }
    res.status(201).json(created);
  }
);

examsRouter.patch(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('exam.update', 'exam'),
  async (req, res) => {
    const body = req.body as {
      title?: string;
      totalMarks?: number;
      timeLimit?: number;
      status?: 'draft' | 'scheduled' | 'active' | 'completed';
      scheduledAt?: string;
      questionIds?: string[];
    };
    const [updated] = await db
      .update(exams)
      .set({
        ...(body.title != null && { title: body.title }),
        ...(body.totalMarks != null && { totalMarks: body.totalMarks }),
        ...(body.timeLimit != null && { timeLimit: body.timeLimit }),
        ...(body.status != null && { status: body.status }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
        updatedAt: new Date(),
      })
      .where(eq(exams.examId, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Exam not found' });
    if (body.questionIds) {
      await db.delete(examQuestions).where(eq(examQuestions.examId, req.params.id));
      if (body.questionIds.length) {
        await db.insert(examQuestions).values(
          body.questionIds.map((questionId, i) => ({
            examId: req.params.id,
            questionId,
            questionOrder: i,
          }))
        );
      }
    }
    res.json(updated);
  }
);

examsRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('exam.delete', 'exam'),
  async (req, res) => {
    await db.delete(exams).where(eq(exams.examId, req.params.id));
    res.status(204).send();
  }
);
