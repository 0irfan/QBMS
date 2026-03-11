import { Router } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db.js';
import { instructorInvites, users, classes } from '@qbms/database';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { sendEmail } from '../lib/email.js';

export const invitesRouter = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:8080';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Admin only: invite instructor by email. Sends link with token; they register with that token to become instructor. */
invitesRouter.post(
  '/instructor',
  authMiddleware,
  requireRoles('super_admin'),
  async (req: AuthRequest, res) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email } = parsed.data;
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length) return res.status(409).json({ error: 'Email already registered' });

    const token = uuidv4();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(instructorInvites).values({
      email,
      tokenHash,
      expiresAt,
    });

    const registerLink = `${APP_URL}/register?invite=${token}`;
    await sendEmail(
      email,
      'You\'re invited to join QBMS as an Instructor',
      `You have been invited to join QBMS as an instructor. Create your account here: ${registerLink}\n\nThis link expires in 7 days.`,
      `You have been invited to join QBMS as an instructor. <a href="${registerLink}">Create your account</a>. This link expires in 7 days.`
    ).catch(() => {});

    res.status(201).json({ message: 'Invitation sent to ' + email });
  }
);

/** Public: validate invite token. Returns email and role for pre-filling register form. */
invitesRouter.get('/validate/:token', async (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ error: 'Token required' });
  const hash = hashToken(token);
  const [invite] = await db
    .select()
    .from(instructorInvites)
    .where(eq(instructorInvites.tokenHash, hash))
    .limit(1);
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired invite' });
  }
  res.json({ email: invite.email, role: 'instructor' });
});

/** Instructor or admin: send class invite to student by email (enrollment code + link to join). */
invitesRouter.post(
  '/student',
  authMiddleware,
  requireRoles('super_admin', 'instructor'),
  async (req: AuthRequest, res) => {
    const parsed = z.object({
      email: z.string().email(),
      classId: z.string().uuid(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, classId } = parsed.data;

    const [cls] = await db.select().from(classes).where(eq(classes.classId, classId)).limit(1);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    if (req.user!.role === 'instructor' && cls.instructorId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not your class' });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser) {
      // User exists, send them a join link
      const joinUrl = `${APP_URL}/dashboard/classes/join?code=${encodeURIComponent(cls.enrollmentCode)}`;
      await sendEmail(
        email,
        `Join class: ${cls.className}`,
        `You have been invited to join the class "${cls.className}". Use this link to join: ${joinUrl}\n\nOr enter this code manually: ${cls.enrollmentCode}`,
        `You have been invited to join the class "<strong>${cls.className}</strong>". <a href="${joinUrl}">Join class</a>. Or enter this code manually: <code>${cls.enrollmentCode}</code>`
      ).catch(() => {});
    } else {
      // User doesn't exist, send them a registration link with the enrollment code
      const registerUrl = `${APP_URL}/register?code=${encodeURIComponent(cls.enrollmentCode)}&email=${encodeURIComponent(email)}`;
      await sendEmail(
        email,
        `Join class: ${cls.className}`,
        `You have been invited to join the class "${cls.className}". Create your account to join: ${registerUrl}\n\nEnrollment code: ${cls.enrollmentCode}`,
        `You have been invited to join the class "<strong>${cls.className}</strong>". <a href="${registerUrl}">Create your account</a> to join. Enrollment code: <code>${cls.enrollmentCode}</code>`
      ).catch(() => {});
    }

    res.status(201).json({ message: 'Invitation sent to ' + email });
  }
);
