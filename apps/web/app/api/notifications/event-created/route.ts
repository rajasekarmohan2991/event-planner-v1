import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendMail } from '@/lib/email/mailer'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, name, startsAt, endsAt, city, venue } = await req.json()

    const to = String((session as any).user.email)
    const subject = `Your event is live: ${name}`
    const startStr = startsAt ? new Date(startsAt).toLocaleString() : ''
    const endStr = endsAt ? new Date(endsAt).toLocaleString() : ''
    const when = startStr && endStr ? `${startStr} → ${endStr}` : (startStr || endStr || '')

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
        <h2 style="margin:0 0 8px 0;">🎉 Your event is live</h2>
        <p style="margin:0 0 12px 0;">Thanks for creating <strong>${name || 'your event'}</strong>.</p>
        <ul style="padding-left:16px; margin:0 0 12px 0;">
          ${when ? `<li><strong>When:</strong> ${when}</li>` : ''}
          ${city ? `<li><strong>City:</strong> ${city}</li>` : ''}
          ${venue ? `<li><strong>Venue:</strong> ${venue}</li>` : ''}
          ${eventId ? `<li><strong>Event ID:</strong> ${eventId}</li>` : ''}
        </ul>
        <p style="margin:12px 0 0 0;">You can manage your event here:</p>
        <p style="margin:4px 0 0 0;"><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${eventId}" target="_blank">Open Event Dashboard</a></p>
      </div>
    `

    // Attempt to send; if SMTP missing, return noop 200 so UI doesn't break
    try {
      await sendMail({ to, subject, html })
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      // Graceful no-op if SMTP not configured in dev
      if ((err?.message || '').includes('SMTP is not configured')) {
        return NextResponse.json({ ok: true, warning: 'SMTP not configured; mail not sent' })
      }
      throw err
    }
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to send notification' }, { status: 500 })
  }
}
