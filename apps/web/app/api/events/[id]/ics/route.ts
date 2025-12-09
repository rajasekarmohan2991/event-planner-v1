import { NextRequest, NextResponse } from 'next/server'

function icsEscape(s: string) {
  return (s || '').replace(/,|;|\\/g, (m) => ({ ',': '\\,', ';': '\\;', '\\': '\\\\' } as any)[m])
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  // Fetch event via internal API; fall back to minimal details
  let name = 'Event'
  let startsAt: string | undefined
  let endsAt: string | undefined
  try {
    const base = process.env.NEXTAUTH_URL || ''
    const url = base ? `${base}/api/events/${eventId}` : `/api/events/${eventId}`
    const res = await fetch(url as any, { cache: 'no-store' })
    if (res.ok) {
      const e: any = await res.json()
      name = e?.name || name
      startsAt = e?.startsAt || undefined
      endsAt = e?.endsAt || undefined
    }
  } catch {}

  // Format times to UTC in ICS format YYYYMMDDTHHMMSSZ
  const fmt = (iso?: string) => iso ? new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') : undefined
  const dtStart = fmt(startsAt) || fmt(new Date().toISOString())!
  const dtEnd = fmt(endsAt) || dtStart

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventPlanner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}@eventplanner`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(name)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ]

  const body = lines.join('\r\n')
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${eventId}.ics"`
    }
  })
}
