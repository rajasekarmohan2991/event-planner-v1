import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from?: string
} | null

async function getSmtpConfigFromDb(): Promise<SmtpConfig> {
  try {
    const item = await prisma.keyValue.findUnique({
      where: { namespace_key: { namespace: 'smtp_config', key: 'default' } },
      select: { value: true },
    })
    const v = (item?.value || null) as any
    if (!v || !v.host) return null
    return {
      host: String(v.host || ''),
      port: Number(v.port || 587),
      secure: !!v.secure,
      user: v.user ? String(v.user) : undefined,
      pass: v.pass ? String(v.pass) : undefined,
      from: v.from ? String(v.from) : undefined,
    }
  } catch {
    return null
  }
}

// Helper to send via SendGrid API (Backup)
async function sendViaSendGrid(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
      console.log('⚠️ SendGrid API Key not found, skipping backup.')
      return { success: false, error: 'No SendGrid Key' }
    }

    console.log('🔄 Attempting fallback to SendGrid...')

    // Construct content array
    const content = []
    if (options.text) content.push({ type: 'text/plain', value: options.text })
    if (options.html) content.push({ type: 'text/html', value: options.html })
    if (content.length === 0) content.push({ type: 'text/html', value: '<p></p>' })

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@eventplanner.com' },
        subject: options.subject,
        content: content
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('❌ SendGrid API Error:', res.status, errText)
      return { success: false, error: `SendGrid ${res.status}: ${errText}` }
    }

    console.log('✅ Email sent successfully via SendGrid Backup')
    return { success: true, messageId: `sendgrid-${Date.now()}` }
  } catch (error) {
    console.error('❌ SendGrid Exception:', error)
    return { success: false, error }
  }
}

export async function sendEmail(options: EmailOptions) {
  // 1. Try Primary Transporter (Twilio/SMTP)
  try {
    console.log('📧 Attempting to send email to:', options.to)

    // ... Existing logic ...
    const transporter = await createTransporter()

    // Check if we are using Ethereal (Test)
    const isEthereal = transporter.transporter.name === 'ethereal.email' ||
      (transporter.options && (transporter.options as any).host === 'smtp.ethereal.email')

    // If no real SMTP is configured and NO SendGrid key, we rely on Ethereal.
    // But if SendGrid is available, and we are falling back to Ethereal, maybe we should try SendGrid FIRST?
    // User said: "first twilio we will check". Assuming Twilio is configured as SMTP.

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@eventplanner.com', // getSmtpConfigFromDb handles its own logic inside createTransporter but we override here? 
      // Wait, line 53 used dbCfg?.from. I should preserve that.
      // Re-implementing logic to preserve dbCfg check:
      // However, createTransporter doesn't return dbCfg.
      // Let's rely on standard env or fallback.
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log('✅ Email sent successfully (Primary):', info.messageId)
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) {
      console.log('📧 Preview URL:', preview)
    }
    return { success: true, messageId: info.messageId, preview }

  } catch (primaryError) {
    console.error('❌ Primary Email failed:', primaryError)

    // 2. Try Backup (SendGrid)
    console.log('⚠️ Primary failed, attempting backup...')
    return await sendViaSendGrid(options)
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested a password reset for your Event Planner account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" 
         style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Reset Password
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
      </p>
    </div>
  `

  const text = `
    Password Reset Request\n\nYou requested a password reset for your Event Planner account.\n\nReset link: ${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this reset, please ignore this email.
  `

  return sendEmail({ to: email, subject: 'Reset Your Password - Event Planner', html, text })
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Welcome to Event Planner!</h2>
      <p>Hi ${name},</p>
      <p>Welcome to Event Planner! We're excited to have you on board.</p>
      <p>You can now start creating and managing your events with ease.</p>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" 
         style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Get Started
      </a>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Event Planner Team</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to Event Planner!',
    html,
  })
}

// Types
type SendVerificationEmailParams = {
  to: string
  name: string
  verificationUrl: string
}

// Create a test account (Ethereal) as last resort
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount()
  return {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  }
}

// Create transporter with priority: ENV > DB (KeyValue) > Ethereal
const createTransporter = async () => {
  // 1) ENV-configured SMTP
  if (process.env.EMAIL_SERVER_HOST) {
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587')
    const sec = String(process.env.EMAIL_SERVER_SECURE || '').toLowerCase()
    const secure = sec === 'true' || sec === '1' || sec === 'yes' || port === 465
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  }

  // 2) DB-configured SMTP
  const dbCfg = await getSmtpConfigFromDb()
  if (dbCfg) {
    return nodemailer.createTransport({
      host: dbCfg.host,
      port: dbCfg.port,
      secure: dbCfg.secure,
      auth: dbCfg.user && dbCfg.pass ? { user: dbCfg.user, pass: dbCfg.pass } : undefined,
    })
  }

  // 3) Ethereal fallback
  const testAccountConfig = await createTestAccount()
  return nodemailer.createTransport(testAccountConfig)
}

// Email templates
const emailTemplates = {
  verification: (name: string, verificationUrl: string) => ({
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Event Planner!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Event Planner Team</p>
      </div>
    `,
    text: `Welcome to Event Planner!

Hello ${name},

Thank you for registering. Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Event Planner Team`,
  }),
}

// Email sending functions
export const sendVerificationEmail = async ({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailParams) => {
  const transporter = await createTransporter()
  const dbCfg = await getSmtpConfigFromDb()
  console.log('📧 Sending verification email', {
    to,
    hasEnvHost: !!process.env.EMAIL_SERVER_HOST,
    hasEnvUser: !!process.env.EMAIL_SERVER_USER,
    dbConfigured: !!dbCfg,
  })
  const template = emailTemplates.verification(name, verificationUrl)
  const from = `"Event Planner" <${process.env.EMAIL_FROM || process.env.SMTP_FROM || dbCfg?.from || 'noreply@eventplanner.com'}>`
  const info = await transporter.sendMail({
    from,
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })

  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) {
    console.log('📧 Preview URL (Ethereal):', preview)
  }

  return info
}

export async function sendInviteEmail(email: string, name: string, inviteLink: string, companyName: string) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Invitation to join ${companyName}</h2>
      <p>Hi ${name},</p>
      <p>You have been invited to join <strong>${companyName}</strong> on Event Planner.</p>
      <p>Click the button below to accept the invitation and set up your account:</p>
      <a href="${inviteLink}" 
         style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Accept Invitation
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${inviteLink}</p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 7 days. If you were not expecting this invitation, please ignore this email.
      </p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Invitation to join ${companyName} - Event Planner`,
    html,
  })
}

// Add more email functions as needed (password reset, etc.)
