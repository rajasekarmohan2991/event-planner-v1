import { getApiBaseUrl } from '@/lib/api/utils'

export type CreateAttendeeBody = {
  name: string
  email: string
  phone?: string | null
  promoCode?: string
  answersJson?: string | null
}

const API = getApiBaseUrl()

export async function createAttendee(eventId: number, body: CreateAttendeeBody) {
  const res = await fetch(`${API}/api/events/${eventId}/attendees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Failed to create attendee')
  }
  return res.json()
}
