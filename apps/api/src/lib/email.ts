import nodemailer from 'nodemailer';

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
