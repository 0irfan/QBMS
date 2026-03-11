/**
 * Beautiful email templates for QBMS
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

/**
 * OTP Verification Email
 */
export function createOtpEmail(otp: string, email: string): EmailTemplate {
  const subject = `Your QBMS Verification Code - ${otp}`;
  
  return {
    subject,
    text: `Your verification code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QBMS Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 30px; text-align: center;">
                    <svg width="60" height="60" viewBox="0 0 100 100" style="display: block; margin: 0 auto;">
                      <rect width="100" height="100" rx="20" fill="url(#grad1)"/>
                      <path d="M30 25 L70 25 L70 35 L40 35 L40 45 L65 45 L65 55 L40 55 L40 75 L30 75 Z" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                      <circle cx="75" cy="70" r="8" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    </svg>
                    <h1 style="color: white; margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">QBMS</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Question Bank Management System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Verify Your Email</h2>
                    <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                      Hello,<br><br>
                      Thank you for registering with QBMS. Please use the verification code below to complete your registration:
                    </p>
                    
                    <!-- OTP Code -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #f9fafb; border-radius: 12px; padding: 30px; border: 2px dashed #d1d5db;">
                      <tr>
                        <td style="text-align: center;">
                          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #0d9488; letter-spacing: 8px;">${otp}</span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; margin: 20px 0 30px 0; font-size: 14px; line-height: 1.5;">
                      <strong>Important:</strong> This code will expire in 10 minutes.<br>
                      If you didn't request this code, please ignore this email or contact support if you have concerns.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #0d9488;">
                          <a href="${process.env.APP_URL || 'https://qbms.pro'}/register" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 16px; font-weight: 600; color: white; text-decoration: none;">
                            Complete Registration
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                      &copy; ${new Date().getFullYear()} QBMS. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      This is an automated message. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Invitation Email (Instructor)
 */
export function createInvitationEmail(email: string, inviteLink: string, role: 'instructor' | 'student'): EmailTemplate {
  const subject = role === 'instructor' 
    ? 'You\'re invited to join QBMS as an Instructor'
    : `You've been invited to join a class on QBMS`;
  
  return {
    subject,
    text: `You have been invited to join QBMS as a ${role}. Create your account here: ${inviteLink}\n\nThis link expires in 7 days.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QBMS Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 30px; text-align: center;">
                    <svg width="60" height="60" viewBox="0 0 100 100" style="display: block; margin: 0 auto;">
                      <rect width="100" height="100" rx="20" fill="url(#grad1)"/>
                      <path d="M30 25 L70 25 L70 35 L40 35 L40 45 L65 45 L65 55 L40 55 L40 75 L30 75 Z" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                      <circle cx="75" cy="70" r="8" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    </svg>
                    <h1 style="color: white; margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">QBMS</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Question Bank Management System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">You've Been Invited!</h2>
                    <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                      Hello,<br><br>
                      You have been invited to join QBMS as a <strong>${role}</strong>. Create your account to get started:
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #0d9488;">
                          <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 16px; font-weight: 600; color: white; text-decoration: none;">
                            Create Your Account
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
                      <strong>Important:</strong> This link will expire in 7 days.<br>
                      If you didn't expect this invitation, please ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                      &copy; ${new Date().getFullYear()} QBMS. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      This is an automated message. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Password Reset Email
 */
export function createPasswordResetEmail(resetLink: string): EmailTemplate {
  const subject = 'Reset Your QBMS Password';
  
  return {
    subject,
    text: `Reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QBMS Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 30px; text-align: center;">
                    <svg width="60" height="60" viewBox="0 0 100 100" style="display: block; margin: 0 auto;">
                      <rect width="100" height="100" rx="20" fill="url(#grad1)"/>
                      <path d="M30 25 L70 25 L70 35 L40 35 L40 45 L65 45 L65 55 L40 55 L40 75 L30 75 Z" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                      <circle cx="75" cy="70" r="8" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    </svg>
                    <h1 style="color: white; margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">QBMS</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Question Bank Management System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                    <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                      Hello,<br><br>
                      We received a request to reset your QBMS password. Click the button below to create a new password:
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #0d9488;">
                          <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 16px; font-weight: 600; color: white; text-decoration: none;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
                      <strong>Important:</strong> This link will expire in 1 hour.<br>
                      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                      &copy; ${new Date().getFullYear()} QBMS. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      This is an automated message. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Class Enrollment Email
 */
export function createClassEnrollmentEmail(className: string, enrollmentCode: string, joinUrl: string, email: string): EmailTemplate {
  const subject = `Join Class: ${className}`;
  
  return {
    subject,
    text: `You have been invited to join the class "${className}". Use this link to join: ${joinUrl}\n\nOr enter this code manually: ${enrollmentCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QBMS Class Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 30px; text-align: center;">
                    <svg width="60" height="60" viewBox="0 0 100 100" style="display: block; margin: 0 auto;">
                      <rect width="100" height="100" rx="20" fill="url(#grad1)"/>
                      <path d="M30 25 L70 25 L70 35 L40 35 L40 45 L65 45 L65 55 L40 55 L40 75 L30 75 Z" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                      <circle cx="75" cy="70" r="8" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    </svg>
                    <h1 style="color: white; margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">QBMS</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Question Bank Management System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">You've Been Invited to Join a Class!</h2>
                    <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                      Hello,<br><br>
                      You have been invited to join the class:
                    </p>
                    
                    <!-- Class Info Card -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #f9fafb; border-radius: 12px; padding: 25px; border: 2px solid #e5e7eb;">
                      <tr>
                        <td>
                          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Class Name</p>
                          <p style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">${className}</p>
                          
                          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Enrollment Code</p>
                          <p style="color: #0d9488; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${enrollmentCode}</p>
                          
                          <p style="color: #6b7280; margin: 0; font-size: 14px;">
                            Use this code to join the class after you register.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px auto;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #0d9488;">
                          <a href="${joinUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 16px; font-weight: 600; color: white; text-decoration: none;">
                            Join Class Now
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
                      If you don't have an account yet, you'll be prompted to create one first.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                      &copy; ${new Date().getFullYear()} QBMS. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      This is an automated message. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}
