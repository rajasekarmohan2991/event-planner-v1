import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const {
      subject,
      html,
      text,
      includeRegistrations = true,
      includeRsvps = true,
      registrationStatuses,
      rsvpStatuses,
      dryRun = false,
      testEmail,
      dedupe = true,
    } = await req.json()

    if (!subject || !(html || text)) {
      return NextResponse.json({ error: 'subject and html/text are required' }, { status: 400 })
    }

    // Build recipient list
    const emails = new Set<string>()
    const recipients: string[] = []

    if (includeRegistrations) {
      const regs = await prisma.registration.findMany({
        where: {
          eventId,
          ...(registrationStatuses && registrationStatuses.length
            ? { status: { in: registrationStatuses } }
            : {}),
        },
        select: { email: true },
      })
      for (const r of regs) {
        const e = (r.email || '').trim()
        if (!e) continue
        if (dedupe) {
          if (!emails.has(e)) { emails.add(e); recipients.push(e) }
        } else {
          recipients.push(e)
        }
      }
    }

    if (includeRsvps) {
      const rsvps = await prisma.rSVP.findMany({
        where: {
          eventId,
          ...(rsvpStatuses && rsvpStatuses.length ? { status: { in: rsvpStatuses } } : {}),
        },
        select: { email: true },
      })
      for (const r of rsvps) {
        const e = (r.email || '').trim()
        if (!e) continue
        if (dedupe) {
          if (!emails.has(e)) { emails.add(e); recipients.push(e) }
        } else {
          recipients.push(e)
        }
      }
    }

    // If testEmail provided, override recipients to just the test address
    const finalRecipients = testEmail ? [testEmail] : recipients

    if (dryRun) {
      return NextResponse.json({ success: true, dryRun: true, count: finalRecipients.length, recipients: finalRecipients.slice(0, 50) })
    }

    // Send in simple sequence (can batch/parallelize later)
    let sent = 0
    for (const to of finalRecipients) {
      const res = await sendEmail({ to, subject, html: html || '', text })
      if (res.success) sent++
    }

    return NextResponse.json({ success: true, sent, total: finalRecipients.length })
  } catch (err) {
    console.error('Attendee email error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
