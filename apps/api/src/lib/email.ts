import nodemailer from 'nodemailer';
import { createOtpEmail, createInvitationEmail, createPasswordResetEmail, createClassEnrollmentEmail } from './email-templates.js';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@qbms.local';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    const secure = SMTP_PORT === 465;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      ...(SMTP_PORT === 587 && { tls: { rejectUnauthorized: true } }),
    });
  }
  return transporter;
}

export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * Send an email via SMTP. Uses env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL.
 * If SMTP is not configured, does nothing (no throw).
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
  const trans = getTransporter();
  if (!trans) {
    console.warn('SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS); email not sent.');
    return;
  }
  await trans.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    text,
    html: html || text,
  });
}

/**
 * Send OTP email with beautiful template
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const template = createOtpEmail(otp, to);
  await sendEmail(to, template.subject, template.text, template.html);
}

/**
 * Send invitation email with beautiful template
 */
export async function sendInvitationEmail(to: string, inviteLink: string, role: 'instructor' | 'student'): Promise<void> {
  const template = createInvitationEmail(to, inviteLink, role);
  await sendEmail(to, template.subject, template.text, template.html);
}

/**
 * Send password reset email with beautiful template
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const template = createPasswordResetEmail(resetLink);
  await sendEmail(to, template.subject, template.text, template.html);
}

/**
 * Send class enrollment email with beautiful template
 */
export async function sendClassEnrollmentEmail(to: string, className: string, enrollmentCode: string, joinUrl: string): Promise<void> {
  const template = createClassEnrollmentEmail(className, enrollmentCode, joinUrl, to);
  await sendEmail(to, template.subject, template.text, template.html);
}
