import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js';
import { db } from '../lib/db.js';
import { users } from '@qbms/database';
import { eq } from 'drizzle-orm';
import type { JwtPayload, UserRole } from '@qbms/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: UserRole };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { jti?: string };
    if (decoded.jti) {
      const blacklisted = await redis.get(`blacklist:${decoded.jti}`);
      if (blacklisted) return res.status(401).json({ error: 'Token revoked' });
    }
    const [user] = await db.select().from(users).where(eq(users.userId, decoded.sub)).limit(1);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    req.user = { userId: user.userId, email: user.email, role: user.role as UserRole };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
