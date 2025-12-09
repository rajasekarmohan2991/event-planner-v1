import nodemailer from 'nodemailer'

export function createTransport() {
  const host = process.env.EMAIL_SERVER_HOST
  const port = Number(process.env.EMAIL_SERVER_PORT || 587)
  const secure = String(process.env.EMAIL_SERVER_SECURE || 'false') === 'true'
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Please set EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export async function sendMail(opts: { to: string; subject: string; html?: string; text?: string; fromOverride?: string }) {
  const from = opts.fromOverride || process.env.EMAIL_FROM || 'Event Planner <noreply@example.com>'
  const transporter = createTransport()
  const info = await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
  return info
}
