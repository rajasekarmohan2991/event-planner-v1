export type CalendarEvent = {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  location?: string
  url?: string
  organizer?: {
    name: string
    email: string
  }
}

export function generateICS(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Planner//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@eventplanner.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`)
  }

  if (event.url) {
    lines.push(`URL:${event.url}`)
  }

  if (event.organizer) {
    lines.push(`ORGANIZER;CN=${escapeText(event.organizer.name)}:MAILTO:${event.organizer.email}`)
  }

  lines.push(
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  )

  return lines.join('\r\n')
}

export function downloadICS(event: CalendarEvent, filename?: string) {
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  window.URL.revokeObjectURL(url)
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description || '',
    location: event.location || '',
    sf: 'true',
    output: 'xml'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generateOutlookUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: event.description || '',
    location: event.location || '',
    path: '/calendar/action/compose'
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const formatYahooDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatYahooDate(event.startDate),
    et: formatYahooDate(event.endDate),
    desc: event.description || '',
    in_loc: event.location || ''
  })

  return `https://calendar.yahoo.com/?${params.toString()}`
}

// Generate calendar links for all major providers
export function generateCalendarLinks(event: CalendarEvent) {
  return {
    google: generateGoogleCalendarUrl(event),
    outlook: generateOutlookUrl(event),
    yahoo: generateYahooCalendarUrl(event),
    ics: () => downloadICS(event)
  }
}
