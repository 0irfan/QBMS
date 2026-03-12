import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db.js';
import { classEnrollments, classes } from '@qbms/database';
import { eq } from 'drizzle-orm';
import type { AuthRequest } from './auth.js';

export interface ScopedRequest extends AuthRequest {
  scope?: {
    role: string;
    enrolledClassIds?: string[];
    managedClassIds?: string[];
  };
}

export async function dataScopingMiddleware(
  req: ScopedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next();
  }

  const { userId, role } = req.user;

  try {
    if (role === 'student') {
      // Get all classes the student is enrolled in
      const enrollments = await db
        .select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, userId));

      req.scope = {
        role: 'student',
        enrolledClassIds: enrollments.map((e) => e.classId),
      };
    } else if (role === 'instructor') {
      // Get all classes the instructor manages
      const managedClasses = await db
        .select({ classId: classes.classId })
        .from(classes)
        .where(eq(classes.instructorId, userId));

      req.scope = {
        role: 'instructor',
        managedClassIds: managedClasses.map((c) => c.classId),
      };
    } else {
      // Admin/super_admin - no scoping
      req.scope = {
        role,
      };
    }

    next();
  } catch (error) {
    console.error('Error in data scoping middleware:', error);
    res.status(500).json({ error: 'Failed to determine data scope' });
  }
}

// Helper function to check if user has access to a class
export function hasClassAccess(req: ScopedRequest, classId: string): boolean {
  if (!req.scope) return false;

  const { role, enrolledClassIds, managedClassIds } = req.scope;

  if (role === 'super_admin' || role === 'admin') {
    return true;
  }

  if (role === 'student' && enrolledClassIds) {
    return enrolledClassIds.includes(classId);
  }

  if (role === 'instructor' && managedClassIds) {
    return managedClassIds.includes(classId);
  }

  return false;
}

// Helper function to apply scoping to class queries
export function applyScopeToClassQuery(req: ScopedRequest): string[] | undefined {
  if (!req.scope) return undefined;

  const { role, enrolledClassIds, managedClassIds } = req.scope;

  if (role === 'super_admin' || role === 'admin') {
    return undefined; // No filter
  }

  if (role === 'student' && enrolledClassIds) {
    return enrolledClassIds;
  }

  if (role === 'instructor' && managedClassIds) {
    return managedClassIds;
  }

  return [];
}
