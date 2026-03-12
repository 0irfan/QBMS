import { Response, NextFunction } from 'express';
import { db } from '../lib/db.js';
import { auditLogs } from '@qbms/database';
import type { AuthRequest } from './auth.js';

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

export interface AuditableRequest extends AuthRequest {
  auditLog?: {
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
  };
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
        resourceId: req.auditLog.resourceId || null,
        details: req.auditLog.details ? JSON.stringify(req.auditLog.details) : null,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                   req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
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

