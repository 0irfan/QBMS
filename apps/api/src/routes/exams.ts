import { Router } from 'express';
import { db } from '../lib/db.js';
import { exams, examQuestions, classes, classEnrollments, questions, questionOptions } from '@qbms/database';
import { eq, and, inArray } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware, setAuditLog, type AuditableRequest } from '../middleware/audit.js';
import { dataScopingMiddleware, applyScopeToClassQuery, hasClassAccess, type ScopedRequest } from '../middleware/dataScoping.js';

export const examsRouter = Router();
examsRouter.use(authMiddleware);
examsRouter.use(dataScopingMiddleware);

examsRouter.get('/', async (req: ScopedRequest, res) => {
  try {
    const classId = req.query.classId as string | undefined;
    const classIds = applyScopeToClassQuery(req);

    let query = db.select().from(exams);

    if (classIds !== undefined) {
      if (classIds.length === 0) {
        return res.json([]);
      }
      query = query.where(inArray(exams.classId, classIds)) as any;
    } else if (classId) {
      query = query.where(eq(exams.classId, classId)) as any;
    }

    const list = await query;
    res.json(list);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

examsRouter.get('/:id', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;
    const [row] = await db.select().from(exams).where(eq(exams.examId, id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Exam not found' });
    
    // Check access
    if (!hasClassAccess(req, row.classId)) {
      return res.status(403).json({ error: 'Access denied to this exam' });
    }
    
    const eqs = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, row.examId))
      .orderBy(examQuestions.questionOrder);
    res.json({ ...row, questions: eqs });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

/** Exam with full question text and options (for take-exam view) */
examsRouter.get('/:id/with-questions', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;
    const [row] = await db.select().from(exams).where(eq(exams.examId, id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Exam not found' });
    
    // Check access
    if (!hasClassAccess(req, row.classId)) {
      return res.status(403).json({ error: 'Access denied to this exam' });
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
  } catch (error) {
    console.error('Error fetching exam with questions:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

examsRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
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
    
    // Check access to class
    if (!hasClassAccess(req, body.classId)) {
      return res.status(403).json({ error: 'Access denied to this class' });
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
    
    // Set audit log
    setAuditLog(req, 'exam.create', 'exam', created.examId, {
      title: created.title,
      classId: created.classId,
      questionCount: body.questionIds?.length || 0,
    });
    
    res.status(201).json(created);
  }
);

examsRouter.patch(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const { id } = req.params;
    const body = req.body as {
      title?: string;
      totalMarks?: number;
      timeLimit?: number;
      status?: 'draft' | 'scheduled' | 'active' | 'completed';
      scheduledAt?: string;
      questionIds?: string[];
    };
    
    // Get exam to check access
    const [exam] = await db.select().from(exams).where(eq(exams.examId, id)).limit(1);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    if (!hasClassAccess(req, exam.classId)) {
      return res.status(403).json({ error: 'Access denied to this exam' });
    }
    
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
      .where(eq(exams.examId, id))
      .returning();
    
    if (body.questionIds) {
      await db.delete(examQuestions).where(eq(examQuestions.examId, id));
      if (body.questionIds.length) {
        await db.insert(examQuestions).values(
          body.questionIds.map((questionId, i) => ({
            examId: id,
            questionId,
            questionOrder: i,
          }))
        );
      }
    }
    
    // Set audit log
    setAuditLog(req, 'exam.update', 'exam', id, {
      title: updated.title,
      status: updated.status,
      changes: body,
    });
    
    res.json(updated);
  }
);

examsRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const { id } = req.params;
    
    // Get exam to check access and for audit log
    const [exam] = await db.select().from(exams).where(eq(exams.examId, id)).limit(1);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    if (!hasClassAccess(req, exam.classId)) {
      return res.status(403).json({ error: 'Access denied to this exam' });
    }
    
    await db.delete(exams).where(eq(exams.examId, id));
    
    // Set audit log
    setAuditLog(req, 'exam.delete', 'exam', id, {
      title: exam.title,
      classId: exam.classId,
    });
    
    res.status(204).send();
  }
);
