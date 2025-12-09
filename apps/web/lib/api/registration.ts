import { getApiBaseUrl } from '@/lib/api/utils'

export type RegistrationSettings = {
  eventId: number
  isOpen: boolean
  deadlineAt: string | null
  capacity: number | null
  waitlistEnabled: boolean
  requireRsvp: boolean
  confirmationTemplateId: number | null
}

export type RegistrationField = {
  id?: number
  fieldKey: string
  label: string
  fieldType: string
  required: boolean
  optionsJson?: string | null
  orderIndex: number
  visibility: string
  logicJson?: string | null
}

const API = getApiBaseUrl()

export async function getRegistrationSettings(eventId: number): Promise<RegistrationSettings> {
  const res = await fetch(`${API}/api/events/${eventId}/registration-settings`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch registration settings')
  return res.json()
}

export async function updateRegistrationSettings(eventId: number, body: RegistrationSettings): Promise<RegistrationSettings> {
  const res = await fetch(`${API}/api/events/${eventId}/registration-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to update registration settings')
  return res.json()
}

export async function listRegistrationFields(eventId: number): Promise<RegistrationField[]> {
  const res = await fetch(`${API}/api/events/${eventId}/registration-fields`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch registration fields')
  return res.json()
}

export async function createRegistrationField(eventId: number, field: RegistrationField): Promise<RegistrationField> {
  const res = await fetch(`${API}/api/events/${eventId}/registration-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(field),
  })
  if (!res.ok) throw new Error('Failed to create registration field')
  return res.json()
}

export async function updateRegistrationField(eventId: number, fieldId: number, field: RegistrationField): Promise<RegistrationField> {
  const res = await fetch(`${API}/api/events/${eventId}/registration-fields/${fieldId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(field),
  })
  if (!res.ok) throw new Error('Failed to update registration field')
  return res.json()
}

export async function deleteRegistrationField(eventId: number, fieldId: number): Promise<void> {
  const res = await fetch(`${API}/api/events/${eventId}/registration-fields/${fieldId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete registration field')
}
