import { Router } from 'express';
import { db } from '../lib/db.js';
import { subjects } from '@qbms/database';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { auditMiddleware, setAuditLog, type AuditableRequest } from '../middleware/audit.js';
import { dataScopingMiddleware, hasClassAccess, type ScopedRequest } from '../middleware/dataScoping.js';

export const subjectsRouter = Router();
subjectsRouter.use(authMiddleware);
subjectsRouter.use(dataScopingMiddleware);

// GET /api/subjects - Get all subjects (backward compatibility)
subjectsRouter.get('/', async (req: ScopedRequest, res) => {
  try {
    const allSubjects = await db.select().from(subjects);
    res.json(allSubjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// GET /api/subjects/:id - Get single subject (with access check)
subjectsRouter.get('/:id', async (req: ScopedRequest, res) => {
  try {
    const [row] = await db.select().from(subjects).where(eq(subjects.subjectId, req.params.id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Subject not found' });
    
    // Check access to the class
    if (!hasClassAccess(req, row.classId)) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }
    
    res.json(row);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// POST /api/subjects - Create subject (requires classId)
subjectsRouter.post(
  '/',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const body = req.body as { classId: string; subjectName: string; description?: string };
    
    if (!body.classId || !body.subjectName) {
      return res.status(400).json({ error: 'classId and subjectName required' });
    }
    
    // Check access to the class
    if (!hasClassAccess(req, body.classId)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }
    
    const [created] = await db.insert(subjects).values({
      classId: body.classId,
      subjectName: body.subjectName,
      description: body.description ?? null,
      createdBy: req.user!.userId,
    }).returning();
    
    // Set audit log
    setAuditLog(req, 'subject.create', 'subject', created.subjectId, {
      subjectName: created.subjectName,
      classId: created.classId,
    });
    
    res.status(201).json(created);
  }
);

// PATCH /api/subjects/:id - Update subject
subjectsRouter.patch(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const body = req.body as { subjectName?: string; description?: string; classId?: string };
    
    // Get subject before update
    const [before] = await db.select().from(subjects).where(eq(subjects.subjectId, req.params.id)).limit(1);
    if (!before) return res.status(404).json({ error: 'Subject not found' });
    
    // Check access to current class
    if (!hasClassAccess(req, before.classId)) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }
    
    // If moving to different class, check access to new class
    if (body.classId && body.classId !== before.classId) {
      if (!hasClassAccess(req, body.classId)) {
        return res.status(403).json({ error: 'Access denied to target class' });
      }
    }
    
    const [updated] = await db
      .update(subjects)
      .set({
        ...(body.subjectName != null && { subjectName: body.subjectName }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.classId != null && { classId: body.classId }),
      })
      .where(eq(subjects.subjectId, req.params.id))
      .returning();
    
    // Set audit log
    setAuditLog(req, 'subject.update', 'subject', updated.subjectId, {
      subjectName: updated.subjectName,
      classId: updated.classId,
      changes: {
        before: { subjectName: before.subjectName, classId: before.classId },
        after: { subjectName: updated.subjectName, classId: updated.classId },
      },
    });
    
    res.json(updated);
  }
);

// DELETE /api/subjects/:id - Delete subject
subjectsRouter.delete(
  '/:id',
  requireRoles('super_admin', 'instructor'),
  async (req: ScopedRequest & AuditableRequest, res) => {
    const { id } = req.params;
    
    // Get subject before deleting
    const [subject] = await db.select().from(subjects).where(eq(subjects.subjectId, id)).limit(1);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    
    // Check access
    if (!hasClassAccess(req, subject.classId)) {
      return res.status(403).json({ error: 'Access denied to this subject' });
    }
    
    await db.delete(subjects).where(eq(subjects.subjectId, id));
    
    // Set audit log
    setAuditLog(req, 'subject.delete', 'subject', id, {
      subjectName: subject.subjectName,
      classId: subject.classId,
    });
    
    res.status(204).send();
  }
);
