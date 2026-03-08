import { Router } from 'express';
import { db } from '../lib/db.js';
import { classes, classEnrollments, users } from '@qbms/database';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';

export const classesRouter = Router();
classesRouter.use(authMiddleware);

function generateCode() {
  return 'C' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

classesRouter.get('/', async (req: AuthRequest, res) => {
  if (req.user!.role === 'super_admin') {
    const list = await db.select().from(classes);
    return res.json(list);
  }
  if (req.user!.role === 'instructor') {
    const list = await db.select().from(classes).where(eq(classes.instructorId, req.user!.userId));
    return res.json(list);
  }
  const enrollments = await db
    .select({ classId: classEnrollments.classId })
    .from(classEnrollments)
    .where(eq(classEnrollments.studentId, req.user!.userId));
  const ids = enrollments.map((e: { classId: string }) => e.classId);
  if (ids.length === 0) return res.json([]);
  const list = await db.select().from(classes).where(eq(classes.classId, ids[0]));
  const rest = await Promise.all(ids.slice(1).map((id: string) => db.select().from(classes).where(eq(classes.classId, id))));
  res.json([...list, ...rest.flat()]);
});

classesRouter.get('/:id', async (req, res) => {
  const [row] = await db.select().from(classes).where(eq(classes.classId, req.params.id)).limit(1);
  if (!row) return res.status(404).json({ error: 'Class not found' });
  res.json(row);
});

classesRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('class.create', 'class'),
  async (req: AuthRequest, res) => {
    const body = req.body as { subjectId: string; className: string; enrollmentCode?: string };
    if (!body.subjectId || !body.className) return res.status(400).json({ error: 'subjectId and className required' });
    const [created] = await db
      .insert(classes)
      .values({
        instructorId: req.user!.userId,
        subjectId: body.subjectId,
        className: body.className,
        enrollmentCode: body.enrollmentCode || generateCode(),
      })
      .returning();
    res.status(201).json(created);
  }
);

classesRouter.post('/enroll', async (req: AuthRequest, res) => {
  const { enrollmentCode } = req.body as { enrollmentCode: string };
  if (!enrollmentCode) return res.status(400).json({ error: 'enrollmentCode required' });
  const [cls] = await db.select().from(classes).where(eq(classes.enrollmentCode, enrollmentCode)).limit(1);
  if (!cls) return res.status(404).json({ error: 'Invalid enrollment code' });
  const existing = await db
    .select()
    .from(classEnrollments)
    .where(
      and(
        eq(classEnrollments.classId, cls.classId),
        eq(classEnrollments.studentId, req.user!.userId)
      )
    );
  if (existing.length) return res.status(409).json({ error: 'Already enrolled' });
  await db.insert(classEnrollments).values({ classId: cls.classId, studentId: req.user!.userId });
  res.status(201).json({ classId: cls.classId, className: cls.className });
});

classesRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  auditMiddleware('class.delete', 'class'),
  async (req, res) => {
    await db.delete(classes).where(eq(classes.classId, req.params.id));
    res.status(204).send();
  }
);

classesRouter.get('/:id/students', async (req: AuthRequest, res) => {
  const [cls] = await db.select().from(classes).where(eq(classes.classId, req.params.id)).limit(1);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  if (req.user!.role === 'instructor' && cls.instructorId !== req.user!.userId) {
    return res.status(403).json({ error: 'Not your class' });
  }
  const enrollments = await db
    .select({
      enrollmentId: classEnrollments.enrollmentId,
      studentId: classEnrollments.studentId,
      enrolledAt: classEnrollments.enrolledAt,
      name: users.name,
      email: users.email,
    })
    .from(classEnrollments)
    .innerJoin(users, eq(classEnrollments.studentId, users.userId))
    .where(eq(classEnrollments.classId, req.params.id));
  res.json(enrollments);
});
