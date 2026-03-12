# Technical Design Document

## System Overview

This design document specifies the technical implementation for Phases 2-4 of the QBMS system refactor. The design addresses three major architectural changes:

1. **Admin Activity Logging System** - Comprehensive audit trail for system administrators
2. **Role-Based Dashboard Separation** - Distinct UI and data scoping for students vs instructors
3. **Subject-Class Hierarchy Restructuring** - Database schema migration to nest subjects under classes

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM
- **Authentication**: JWT-based with refresh tokens
- **State Management**: Zustand

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Student    │  │  Instructor  │  │    Admin     │      │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express.js API Server                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Pipeline                      │   │
│  │  Auth → Audit → DataScoping → RateLimit → Routes    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Classes    │  │   Subjects   │  │  Activity    │      │
│  │   Routes     │  │   Routes     │  │  Log Routes  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Drizzle ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  users   │  │ classes  │  │ subjects │  │  audit   │   │
│  │          │  │          │  │ +classId │  │  _logs   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Middleware Flow Diagram

```
Request → Auth Middleware → Audit Middleware → Data Scoping → Route Handler
          │                 │                   │
          ├─ Verify JWT     ├─ Log Action      ├─ Apply Role Filter
          ├─ Extract User   ├─ Async Insert    ├─ Student: enrollments
          └─ Attach to req  └─ Continue         ├─ Instructor: managed classes
                                                 └─ Admin: no filter
```

## Phase 2: Admin Activity Logging System

### Database Schema Changes

#### Enhanced audit_logs Table

The existing `audit_logs` table will be enhanced with additional fields:

```typescript
// packages/database/src/schema/index.ts

export const auditLogs = pgTable('audit_logs', {
  logId: uuid('log_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
  userEmail: varchar('user_email', { length: 255 }), // NEW: Denormalized for performance
  userRole: userRoleEnum('user_role'), // NEW: Capture role at time of action
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  details: text('details'), // NEW: JSON string with action details
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// Indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_user_role ON audit_logs(user_role);
```

#### Migration Script

```sql
-- Migration: 0008_enhance_audit_logs.sql

-- Add new columns
ALTER TABLE audit_logs ADD COLUMN user_email VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN user_role user_role;
ALTER TABLE audit_logs ADD COLUMN details TEXT;

-- Backfill user_email and user_role from users table
UPDATE audit_logs al
SET user_email = u.email, user_role = u.role
FROM users u
WHERE al.user_id = u.user_id;

-- Create indexes
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_user_role ON audit_logs(user_role);
```

### Backend Components

#### Enhanced Audit Middleware

```typescript
// apps/api/src/middleware/audit.ts

import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db';
import { auditLogs } from '@qbms/database';

interface AuditableRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  auditLog?: {
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
  };
}

// Async logging queue to avoid blocking requests
const logQueue: Array<typeof auditLogs.$inferInsert> = [];
let isProcessing = false;

async function processLogQueue() {
  if (isProcessing || logQueue.length === 0) return;
  
  isProcessing = true;
  const batch = logQueue.splice(0, 100); // Process 100 at a time
  
  try {
    await db.insert(auditLogs).values(batch);
  } catch (error) {
    console.error('Failed to insert audit logs:', error);
    // Could implement retry logic or dead letter queue here
  } finally {
    isProcessing = false;
    if (logQueue.length > 0) {
      setTimeout(processLogQueue, 100);
    }
  }
}

export function auditMiddleware(req: AuditableRequest, res: Response, next: NextFunction) {
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end to log after response
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    // Restore original end
    res.end = originalEnd;
    
    // Log the action asynchronously
    if (req.user && req.auditLog) {
      const logEntry = {
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: req.auditLog.action,
        resourceType: req.auditLog.resourceType,
        resourceId: req.auditLog.resourceId,
        details: req.auditLog.details ? JSON.stringify(req.auditLog.details) : null,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };
      
      logQueue.push(logEntry);
      
      // Trigger processing if not already running
      if (!isProcessing) {
        setImmediate(processLogQueue);
      }
    }
    
    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

// Helper function to set audit log data in routes
export function setAuditLog(
  req: AuditableRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
) {
  req.auditLog = { action, resourceType, resourceId, details };
}
```

#### Activity Logs API Routes

```typescript
// apps/api/src/routes/admin-logs.ts

import { Router } from 'express';
import { db } from '../lib/db';
import { auditLogs } from '@qbms/database';
import { authMiddleware } from '../middleware/auth';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

const router = Router();

// Middleware to check admin role
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

// GET /api/admin/activity-logs
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      action,
      resourceType,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId as string));
    }
    
    if (action) {
      conditions.push(eq(auditLogs.action, action as string));
    }
    
    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType as string));
    }
    
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate as string)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    // Get paginated logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limitNum)
      .offset(offset);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// GET /api/admin/activity-logs/stats
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const stats = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`count(*)`));

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching activity log stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
```

#### Integration in Routes

Example of integrating audit logging in existing routes:

```typescript
// apps/api/src/routes/auth.ts

import { setAuditLog } from '../middleware/audit';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // ... existing login logic ...
    
    // Set audit log
    setAuditLog(req, 'user.login', 'user', user.userId, {
      email: user.email,
      success: true,
    });
    
    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    // Log failed login attempt
    setAuditLog(req, 'user.login.failed', 'user', undefined, {
      email: req.body.email,
      reason: error.message,
    });
    
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// apps/api/src/routes/classes.ts

// Create class endpoint
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newClass = await db.insert(classes).values({...}).returning();
    
    setAuditLog(req, 'class.create', 'class', newClass[0].classId, {
      className: newClass[0].className,
    });
    
    res.json(newClass[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create class' });
  }
});
```

### Frontend Components

#### Admin Activity Logs Page

```typescript
// apps/web/src/app/dashboard/admin/activity-logs/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface ActivityLog {
  logId: string;
  timestamp: string;
  userEmail: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}

export default function ActivityLogsPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      window.location.href = '/dashboard';
      return;
    }
    
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      });
      
      const response = await api.get(`/admin/activity-logs?${params}`);
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAction = (action: string) => {
    return action.replace(/\./g, ' ').toUpperCase();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Activity Logs</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Actions</option>
              <option value="user.login">Login</option>
              <option value="user.register">Register</option>
              <option value="class.create">Create Class</option>
              <option value="class.update">Update Class</option>
              <option value="subject.create">Create Subject</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Resource Type</label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="class">Class</option>
              <option value="subject">Subject</option>
              <option value="exam">Exam</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        
        <button
          onClick={() => {
            setPage(1);
            fetchLogs();
          }}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
      
      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.logId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.userEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatAction(log.action)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.resourceType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```


## Phase 3: Separate Dashboards with Data Scoping

### Data Scoping Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Request Flow with Scoping                 │
└─────────────────────────────────────────────────────────────┘

Student Request → Auth → DataScoping → Query Builder
                   │      │             │
                   │      └─ Add WHERE enrollment.studentId = userId
                   │                    │
                   └─────────────────────┴─→ Database Query
                                            (Only enrolled classes)

Instructor Request → Auth → DataScoping → Query Builder
                      │      │             │
                      │      └─ Add WHERE class.instructorId = userId
                      │                    │
                      └─────────────────────┴─→ Database Query
                                               (Only managed classes)

Admin Request → Auth → DataScoping → Query Builder
                 │      │             │
                 │      └─ No filter added
                 │                    │
                 └─────────────────────┴─→ Database Query
                                          (All data)
```

### Backend Components

#### Data Scoping Middleware

```typescript
// apps/api/src/middleware/dataScoping.ts

import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db';
import { classEnrollments, classes } from '@qbms/database';
import { eq } from 'drizzle-orm';

export interface ScopedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'super_admin' | 'admin' | 'instructor' | 'student';
  };
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
export function applyScopeToClassQuery(req: ScopedRequest) {
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
```

#### Updated API Routes with Scoping

```typescript
// apps/api/src/routes/classes.ts

import { Router } from 'express';
import { db } from '../lib/db';
import { classes, classEnrollments, users } from '@qbms/database';
import { authMiddleware } from '../middleware/auth';
import { dataScopingMiddleware, applyScopeToClassQuery, ScopedRequest } from '../middleware/dataScoping';
import { setAuditLog } from '../middleware/audit';
import { eq, inArray } from 'drizzle-orm';

const router = Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(dataScopingMiddleware);

// GET /api/classes - List classes based on role
router.get('/', async (req: ScopedRequest, res) => {
  try {
    const classIds = applyScopeToClassQuery(req);

    let query = db.select().from(classes);

    if (classIds !== undefined) {
      if (classIds.length === 0) {
        return res.json({ classes: [] });
      }
      query = query.where(inArray(classes.classId, classIds));
    }

    const result = await query;

    res.json({ classes: result });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /api/classes/:id - Get class details with access check
router.get('/:id', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (!hasClassAccess(req, id)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.classId, id));

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ class: classData });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// POST /api/classes - Create class (instructors only)
router.post('/', async (req: ScopedRequest, res) => {
  try {
    if (req.user?.role !== 'instructor' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only instructors can create classes' });
    }

    const { className, subjectId } = req.body;

    const [newClass] = await db
      .insert(classes)
      .values({
        instructorId: req.user.userId,
        className,
        subjectId,
        enrollmentCode: generateEnrollmentCode(),
      })
      .returning();

    setAuditLog(req, 'class.create', 'class', newClass.classId, {
      className: newClass.className,
    });

    res.status(201).json({ class: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// GET /api/classes/:id/students - Get students in class (instructors only)
router.get('/:id/students', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;

    // Only instructors and admins can view student lists
    if (req.user?.role === 'student') {
      return res.status(403).json({ error: 'Students cannot view class rosters' });
    }

    // Check access
    if (!hasClassAccess(req, id)) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    const students = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        enrolledAt: classEnrollments.enrolledAt,
      })
      .from(classEnrollments)
      .innerJoin(users, eq(classEnrollments.studentId, users.userId))
      .where(eq(classEnrollments.classId, id));

    res.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

function generateEnrollmentCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default router;
```

```typescript
// apps/api/src/routes/exams.ts

import { Router } from 'express';
import { db } from '../lib/db';
import { exams, examAttempts } from '@qbms/database';
import { authMiddleware } from '../middleware/auth';
import { dataScopingMiddleware, hasClassAccess, ScopedRequest } from '../middleware/dataScoping';
import { eq, inArray } from 'drizzle-orm';

const router = Router();

router.use(authMiddleware);
router.use(dataScopingMiddleware);

// GET /api/exams - List exams based on role
router.get('/', async (req: ScopedRequest, res) => {
  try {
    const { role, enrolledClassIds, managedClassIds } = req.scope!;

    let query = db.select().from(exams);

    if (role === 'student' && enrolledClassIds) {
      // Students only see exams from enrolled classes
      if (enrolledClassIds.length === 0) {
        return res.json({ exams: [] });
      }
      query = query.where(inArray(exams.classId, enrolledClassIds));
    } else if (role === 'instructor' && managedClassIds) {
      // Instructors only see exams from managed classes
      if (managedClassIds.length === 0) {
        return res.json({ exams: [] });
      }
      query = query.where(inArray(exams.classId, managedClassIds));
    }

    const result = await query;

    res.json({ exams: result });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id - Get exam details with access check
router.get('/:id', async (req: ScopedRequest, res) => {
  try {
    const { id } = req.params;

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.examId, id));

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if user has access to the class
    if (!hasClassAccess(req, exam.classId)) {
      return res.status(403).json({ error: 'Access denied to this exam' });
    }

    res.json({ exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// GET /api/exams/attempts/my - Get student's own attempts
router.get('/attempts/my', async (req: ScopedRequest, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their attempts' });
    }

    const attempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.studentId, req.user.userId));

    res.json({ attempts });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

export default router;
```

### Frontend Components

#### Dashboard Router

```typescript
// apps/web/src/app/dashboard/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Route based on role
    switch (user.role) {
      case 'student':
        router.push('/dashboard/student');
        break;
      case 'instructor':
        router.push('/dashboard/instructor');
        break;
      case 'super_admin':
      case 'admin':
        router.push('/dashboard/admin');
        break;
      default:
        router.push('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
```

#### Student Dashboard

```typescript
// apps/web/src/app/dashboard/student/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface Class {
  classId: string;
  className: string;
  instructorName: string;
}

interface ExamAttempt {
  attemptId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [classesRes, attemptsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/exams/attempts/my'),
      ]);

      setClasses(classesRes.data.classes);
      setRecentAttempts(attemptsRes.data.attempts.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enrolled Classes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">My Classes</h2>
          {classes.length === 0 ? (
            <p className="text-gray-500">You are not enrolled in any classes yet.</p>
          ) : (
            <ul className="space-y-3">
              {classes.map((cls) => (
                <li
                  key={cls.classId}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/classes/${cls.classId}`}
                >
                  <div className="font-medium">{cls.className}</div>
                  <div className="text-sm text-gray-600">
                    Instructor: {cls.instructorName}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Exam Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Exam Results</h2>
          {recentAttempts.length === 0 ? (
            <p className="text-gray-500">No exam attempts yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentAttempts.map((attempt) => (
                <li key={attempt.attemptId} className="p-3 border rounded">
                  <div className="font-medium">{attempt.examTitle}</div>
                  <div className="text-sm text-gray-600">
                    Score: {attempt.score}/{attempt.totalMarks} (
                    {((attempt.score / attempt.totalMarks) * 100).toFixed(1)}%)
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/classes/join'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Join a Class
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/exams'}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            View Available Exams
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Instructor Dashboard

```typescript
// apps/web/src/app/dashboard/instructor/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface Class {
  classId: string;
  className: string;
  enrollmentCount: number;
  subjectName: string;
}

interface ClassStats {
  totalClasses: number;
  totalStudents: number;
  totalExams: number;
}

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState<ClassStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalExams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const classesRes = await api.get('/classes');
      const classesData = classesRes.data.classes;

      // Fetch enrollment counts for each class
      const classesWithCounts = await Promise.all(
        classesData.map(async (cls: any) => {
          const studentsRes = await api.get(`/classes/${cls.classId}/students`);
          return {
            ...cls,
            enrollmentCount: studentsRes.data.students.length,
          };
        })
      );

      setClasses(classesWithCounts);

      // Calculate stats
      const totalStudents = classesWithCounts.reduce(
        (sum, cls) => sum + cls.enrollmentCount,
        0
      );

      setStats({
        totalClasses: classesWithCounts.length,
        totalStudents,
        totalExams: 0, // TODO: Fetch exam count
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {stats.totalClasses}
          </div>
          <div className="text-gray-600">Total Classes</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-600">
            {stats.totalStudents}
          </div>
          <div className="text-gray-600">Total Students</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">
            {stats.totalExams}
          </div>
          <div className="text-gray-600">Total Exams</div>
        </div>
      </div>

      {/* Managed Classes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Classes</h2>
          <button
            onClick={() => window.location.href = '/dashboard/classes/create'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create New Class
          </button>
        </div>

        {classes.length === 0 ? (
          <p className="text-gray-500">You haven't created any classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.classId}
                className="border rounded-lg p-4 hover:shadow-md cursor-pointer"
                onClick={() => window.location.href = `/dashboard/classes/${cls.classId}`}
              >
                <h3 className="font-semibold text-lg mb-2">{cls.className}</h3>
                <div className="text-sm text-gray-600 mb-1">
                  Subject: {cls.subjectName}
                </div>
                <div className="text-sm text-gray-600">
                  Students: {cls.enrollmentCount}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/dashboard/classes/${cls.classId}/subjects`;
                    }}
                    className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    Subjects
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/dashboard/classes/${cls.classId}/students`;
                    }}
                    className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/questions'}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Manage Questions
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/exams/create'}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Create Exam
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/analytics'}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
```

