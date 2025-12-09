import { sendMail } from './mailer'

export async function sendEmail(opts: { to: string; subject: string; html?: string; text?: string }) {
  try {
    const info = await sendMail({ to: opts.to, subject: opts.subject, html: opts.html, text: opts.text })
    return { success: true, messageId: (info as any)?.messageId }
  } catch (err: any) {
    // Graceful failure when SMTP not configured; mirror prior API usage
    if ((err?.message || '').includes('SMTP is not configured')) {
      return { success: false, warning: 'SMTP not configured' }
    }
    return { success: false, error: err?.message || 'Failed to send email' }
  }
}
