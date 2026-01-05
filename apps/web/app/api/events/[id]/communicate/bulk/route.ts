import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSMS, sendWhatsApp, buildShareLink } from '@/lib/messaging'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const body = await req.json()

    const {
      channels = ['email'], // 'email' | 'sms' | 'whatsapp' | 'link'
      // Email params
      subject,
      html,
      text,
      includeRegistrations = true,
      includeRsvps = true,
      registrationStatuses,
      rsvpStatuses,
      dedupe = true,
      // SMS/WhatsApp params
      smsMessage,
      whatsappMessage,
      smsRecipients = [], // explicit list of E.164 phone numbers, e.g., +14155551234
      whatsappRecipients = [], // explicit list, can be with or without whatsapp: prefix
      // Global controls
      dryRun = false,
      testEmail,
      testPhone,
    } = body || {}

    const results: Record<string, any> = {}

    // Helper: build email recipients from Registration + RSVP
    const buildEmailRecipients = async (): Promise<string[]> => {
      const emails = new Set<string>()
      const list: string[] = []
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
          if (e) {
            if (dedupe) { if (!emails.has(e)) { emails.add(e); list.push(e) } }
            else { list.push(e) }
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
          if (e) {
            if (dedupe) { if (!emails.has(e)) { emails.add(e); list.push(e) } }
            else { list.push(e) }
          }
        }
      }
      return list
    }

    // EMAIL
    if (channels.includes('email')) {
      if (!subject || !(html || text)) {
        return NextResponse.json({ error: 'Email subject and html/text are required' }, { status: 400 })
      }
      const recipients = testEmail ? [testEmail] : await buildEmailRecipients()
      if (dryRun) {
        results.email = { dryRun: true, count: recipients.length, sample: recipients.slice(0, 50) }
      } else {
        let sent = 0
        for (const to of recipients) {
          const res = await sendEmail({ to, subject, html: html || '', text })
          if (res.success) sent++
        }
        results.email = { sent, total: recipients.length }
      }
    }

    // SMS
    if (channels.includes('sms')) {
      const recipients: string[] = testPhone ? [testPhone] : (smsRecipients || [])
      console.log('📱 SMS Recipients:', recipients)
      console.log('📱 SMS Message:', smsMessage || text || '')
      
      if (!recipients.length) {
        results.sms = { skipped: true, reason: 'No recipients provided. Add phone numbers in E.164 format.' }
      } else if (dryRun) {
        results.sms = { dryRun: true, count: recipients.length, sample: recipients.slice(0, 50) }
      } else {
        let sent = 0
        const errors: string[] = []
        for (const to of recipients) {
          console.log(`📱 Sending SMS to: ${to}`)
          const r = await sendSMS(to, smsMessage || text || '')
          console.log(`📱 SMS Result for ${to}:`, r)
          if (r.success) {
            sent++
          } else {
            errors.push(`${to}: ${r.error || 'Unknown error'}`)
          }
        }
        results.sms = { sent, total: recipients.length, errors: errors.length > 0 ? errors : undefined }
      }
    }

    // WhatsApp
    if (channels.includes('whatsapp')) {
      const recipients: string[] = testPhone ? [testPhone] : (whatsappRecipients || [])
      if (!recipients.length) {
        results.whatsapp = { skipped: true, reason: 'No recipients provided. Add phone numbers for WhatsApp.' }
      } else if (dryRun) {
        results.whatsapp = { dryRun: true, count: recipients.length, sample: recipients.slice(0, 50) }
      } else {
        let sent = 0
        for (const to of recipients) {
          const r = await sendWhatsApp(to, whatsappMessage || text || '')
          if (r.success) sent++
        }
        results.whatsapp = { sent, total: recipients.length }
      }
    }

    // Shareable Links
    if (channels.includes('link')) {
      results.link = {
        rsvp: buildShareLink(eventId, 'rsvp'),
        register: buildShareLink(eventId, 'register'),
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('Bulk communication error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
