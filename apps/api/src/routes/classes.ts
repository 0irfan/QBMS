import { Router } from 'express';
import { db } from '../lib/db.js';
import { classes, classEnrollments, users } from '@qbms/database';
import { eq, and, inArray } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { auditMiddleware, setAuditLog, type AuditableRequest } from '../middleware/audit.js';
import { dataScopingMiddleware, applyScopeToClassQuery, hasClassAccess, type ScopedRequest } from '../middleware/dataScoping.js';

export const classesRouter = Router();
classesRouter.use(authMiddleware);
classesRouter.use(auditMiddleware);
classesRouter.use(dataScopingMiddleware);

function generateCode() {
  return 'C' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

classesRouter.get('/', async (req: ScopedRequest, res) => {
  try {
    const classIds = applyScopeToClassQuery(req);

    let query = db.select().from(classes);

    if (classIds !== undefined) {
      if (classIds.length === 0) {
        return res.json([]);
      }
      query = query.where(inArray(classes.classId, classIds)) as any;
    }

    const list = await query;
    res.json(list);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

classesRouter.get('/:id', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (!hasClassAccess(req, id)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const [row] = await db.select().from(classes).where(eq(classes.classId, id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Class not found' });
    res.json(row);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

classesRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const body = req.body as { className: string; enrollmentCode?: string };
    if (!body.className) return res.status(400).json({ error: 'className required' });
    const [created] = await db
      .insert(classes)
      .values({
        instructorId: req.user!.userId,
        className: body.className,
        enrollmentCode: body.enrollmentCode || generateCode(),
      })
      .returning();
    
    // Set audit log
    setAuditLog(req, 'class.create', 'class', created.classId, {
      className: created.className,
    });
    
    res.status(201).json(created);
  }
);

classesRouter.post('/enroll', async (req: ScopedRequest & AuditableRequest, res) => {
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
  
  // Set audit log
  setAuditLog(req, 'class.enroll', 'class', cls.classId, {
    className: cls.className,
    enrollmentCode,
  });
  
  res.status(201).json({ classId: cls.classId, className: cls.className });
});

classesRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const { id } = req.params;
    
    // Check access
    if (!hasClassAccess(req, id)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }
    
    // Get class info before deleting for audit log
    const [cls] = await db.select().from(classes).where(eq(classes.classId, id)).limit(1);
    
    await db.delete(classes).where(eq(classes.classId, id));
    
    // Set audit log
    if (cls) {
      setAuditLog(req, 'class.delete', 'class', id, {
        className: cls.className,
      });
    }
    
    res.status(204).send();
  }
);

classesRouter.get('/:id/students', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;

    // Only instructors and admins can view student lists
    if (req.user!.role === 'student') {
      return res.status(403).json({ error: 'Students cannot view class rosters' });
    }

    // Check access
    if (!hasClassAccess(req, id)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const [cls] = await db.select().from(classes).where(eq(classes.classId, id)).limit(1);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

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
      .where(eq(classEnrollments.classId, id));
    
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});


// GET /api/classes/:id/subjects - Get subjects for a class
classesRouter.get('/:id/subjects', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (!hasClassAccess(req, id)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const [cls] = await db.select().from(classes).where(eq(classes.classId, id)).limit(1);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const { subjects } = await import('@qbms/database');
    const subjectsList = await db
      .select()
      .from(subjects)
      .where(eq(subjects.classId, id));
    
    res.json(subjectsList);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});
