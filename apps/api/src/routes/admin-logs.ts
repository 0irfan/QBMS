import { Router } from 'express';
import { db } from '../lib/db.js';
import { auditLogs } from '@qbms/database';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

const router = Router();

// Middleware to check admin role
function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

// GET /api/admin/activity-logs
router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
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
      .select({ count: sql<number>`count(*)::int` })
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
router.get('/stats', authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const stats = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)::int`,
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
