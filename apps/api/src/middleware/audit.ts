import { Response, NextFunction } from 'express';
import { db } from '../lib/db.js';
import { auditLogs } from '@qbms/database';
import type { AuthRequest } from './auth.js';

export function auditMiddleware(action: string, resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      const resourceId = (req as { params?: { id?: string } }).params?.id ?? undefined;
      const userId = req.user?.userId ?? null;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] ?? null;
      db.insert(auditLogs)
        .values({
          userId,
          action,
          resourceType,
          resourceId: resourceId || null,
          ipAddress: ip,
          userAgent,
        })
        .catch((err: unknown) => console.error('Audit log failed:', err));
      return originalJson(body);
    };
    next();
  };
}
