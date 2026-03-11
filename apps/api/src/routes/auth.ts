import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db.js';
import { users, refreshTokens, instructorInvites } from '@qbms/database';
import { eq, and, gt } from 'drizzle-orm';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@qbms/shared';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { redis, REDIS_KEYS } from '../lib/redis.js';
import { sendEmail } from '../lib/email.js';

export const authRouter = Router();
const OTP_TTL_SEC = 600; // 10 minutes
const OTP_DIGITS = 6;

function generateOtp(): string {
  return String(Math.floor(Math.pow(10, OTP_DIGITS - 1) + Math.random() * (Math.pow(10, OTP_DIGITS) - Math.pow(10, OTP_DIGITS - 1))));
}
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET;
const ACCESS_EXP = '1h';
const REFRESH_EXP = '7d';
const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Step 1: Submit registration details → send OTP to email (no account created yet) 
 * Registration now requires an invite token - no public registration allowed
 */
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  let { name, email, password, role, inviteToken } = parsed.data;
  email = email.toLowerCase().trim();

  // Require invite token for all registrations
  if (!inviteToken) {
    return res.status(403).json({ error: 'Registration requires an invitation. Please contact an administrator.' });
  }

  const hash = hashToken(inviteToken);
  const [invite] = await db
    .select()
    .from(instructorInvites)
    .where(eq(instructorInvites.tokenHash, hash))
    .limit(1);
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired invite token' });
  }
  email = invite.email;
  role = 'instructor';
  // Invite is marked used only after OTP verify (in register/verify-otp)

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return res.status(409).json({ error: 'Email already registered' });

  const otp = generateOtp();
  const key = REDIS_KEYS.registerOtp(email);
  await redis.setex(key, OTP_TTL_SEC, otp);

  try {
    await sendEmail(
      email,
      'Your QBMS registration OTP',
      `Your verification code is: ${otp}\n\nIt expires in ${OTP_TTL_SEC / 60} minutes.`,
      `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in ${OTP_TTL_SEC / 60} minutes.</p>`
    );
  } catch (e) {
    console.error('Send OTP email error:', e);
    await redis.del(key);
    return res.status(500).json({ error: 'Failed to send OTP email. Try again later.' });
  }

  res.json({ message: 'OTP sent to your email', email });
});

/** Step 2: Verify OTP and create account → then user must log in */
authRouter.post('/register/verify-otp', async (req, res) => {
  const body = req.body as { email: string; otp: string; name: string; password: string; role: string; inviteToken?: string };
  const { email: rawEmail, otp } = body;
  const email = rawEmail?.toLowerCase?.()?.trim();
  if (!email || !otp || !body.name || !body.password || !body.role) {
    return res.status(400).json({ error: 'email, otp, name, password, role required' });
  }

  const key = REDIS_KEYS.registerOtp(email);
  const storedOtp = await redis.get(key);
  if (!storedOtp || storedOtp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  await redis.del(key);

  const parsed = registerSchema.safeParse({
    name: body.name,
    email,
    password: body.password,
    role: body.role,
    inviteToken: body.inviteToken,
  });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  let { name, password, role, inviteToken } = parsed.data;

  if (inviteToken) {
    const hash = hashToken(inviteToken);
    const [invite] = await db
      .select()
      .from(instructorInvites)
      .where(eq(instructorInvites.tokenHash, hash))
      .limit(1);
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }
    role = 'instructor';
    await db.update(instructorInvites).set({ usedAt: new Date() }).where(eq(instructorInvites.inviteId, invite.inviteId));
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await db
    .insert(users)
    .values({ name, email, passwordHash, role: role as 'instructor' | 'student', status: 'active' });

  res.json({ message: 'Account created. Please log in.' });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive' });
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: 'Account locked. Try again later.' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      : null;
    await db.update(users).set({ failedLoginAttempts: attempts, lockedUntil }).where(eq(users.userId, user.userId));
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.userId, user.userId));
  const accessToken = jwt.sign(
    { sub: user.userId, email: user.email, role: user.role, jti: uuidv4() },
    JWT_SECRET,
    { expiresIn: ACCESS_EXP }
  );
  const refreshToken = jwt.sign(
    { sub: user.userId, jti: uuidv4() },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXP }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({
    userId: user.userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });
  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: { userId: user.userId, name: user.name, email: user.email, role: user.role },
      accessToken,
      expiresIn: 3600,
    });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as { sub: string; jti?: string };
    const hash = hashToken(token);
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.userId, decoded.sub), eq(refreshTokens.tokenHash, hash), gt(refreshTokens.expiresAt, new Date())))
      .limit(1);
    if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });
    const [user] = await db.select().from(users).where(eq(users.userId, decoded.sub)).limit(1);
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'User not found or inactive' });
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenId, stored.tokenId));
    const newAccess = jwt.sign(
      { sub: user.userId, email: user.email, role: user.role, jti: uuidv4() },
      JWT_SECRET,
      { expiresIn: ACCESS_EXP }
    );
    const newRefresh = jwt.sign(
      { sub: user.userId, jti: uuidv4() },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXP }
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokens).values({
      userId: user.userId,
      tokenHash: hashToken(newRefresh),
      expiresAt,
    });
    res
      .cookie('refreshToken', newRefresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken: newAccess, expiresIn: 3600 });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.accessToken;
  if (token) {
    try {
      const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null;
      if (decoded?.jti && decoded.exp) {
        await redis.setex(`blacklist:${decoded.jti}`, decoded.exp - Math.floor(Date.now() / 1000), '1');
      }
    } catch {}
  }
  res.clearCookie('refreshToken').json({ ok: true });
});

authRouter.post('/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (user) {
    const { passwordResetTokens } = await import('@qbms/database');
    const resetToken = uuidv4();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ userId: user.userId, tokenHash, expiresAt });
    const appUrl = process.env.APP_URL || 'http://localhost:8080';
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
    try {
      await sendEmail(
        user.email,
        'Password Reset',
        `Reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
        `Reset your password: <a href="${resetLink}">${resetLink}</a><br><br>This link expires in 1 hour.`
      );
    } catch (e) {
      console.error('Email send error:', e);
    }
  }
  res.json({ message: 'If the email exists, a reset link has been sent.' });
});

authRouter.post('/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { passwordResetTokens } = await import('@qbms/database');
  const hash = hashToken(parsed.data.token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hash))
    .limit(1);
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.userId, row.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.tokenId, row.tokenId));
  res.json({ message: 'Password updated' });
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db
    .select({ userId: users.userId, name: users.name, email: users.email, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.userId, req.user!.userId))
    .limit(1);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
