import { Event, EventStatus } from '@/types/event'

// ALWAYS use Next.js API proxy, never call Java API directly from browser
const API_URL = '/api'

export interface GetEventsParams {
  page?: number
  limit?: number
  search?: string
  status?: EventStatus
  eventMode?: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID'
  fromDate?: string
  toDate?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'startsAt' | 'priceInr' | 'name'
  sortDir?: 'ASC' | 'DESC'
}

// Permanently delete an event (only if already TRASHED)
export async function purgeEvent(id: string, _accessToken?: string): Promise<void> {
  const response = await fetch(`/api/events/${id}/purge`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 401) throw new Error('Unauthorized. Please log in again.')
    if (response.status === 403) throw new Error('Access denied. You must be logged in to delete an event.')
    if (response.status === 409) throw new Error('Only trashed events can be permanently deleted')
    throw new Error(error.message || 'Failed to permanently delete event')
  }
}

// Update an event (same payload shape as create)
export async function updateEvent(id: string, data: CreateEventRequest, _accessToken?: string): Promise<Event> {
  // Use Java API proxy (server will attach tenant and role headers)
  const response = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to update event')
  }
  return response.json()
}

// Delete an event
export async function deleteEvent(id: string, _accessToken?: string): Promise<void> {
  // Use local proxy to attach server-side Authorization
  const response = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 401) throw new Error('Unauthorized. Please log in again.')
    if (response.status === 403) throw new Error('Access denied. You must be logged in to delete an event.')
    if (response.status === 404) throw new Error(`Event not found (ID: ${id}).`)
    throw new Error(error.message || 'Failed to delete event')
  }
}

// Java API EventRequest shape
export interface CreateEventRequest {
  name: string
  venue?: string
  address?: string
  city: string
  startsAt: string // ISO string
  endsAt: string   // ISO string
  priceInr: number
  description?: string
  bannerUrl?: string
  category?: string
  eventMode: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID'
  budgetInr?: number
  expectedAttendees?: number
  latitude?: number
  longitude?: number
  termsAndConditions?: string
  disclaimer?: string
  eventManagerName?: string
  eventManagerContact?: string
  eventManagerEmail?: string
}

// Create event with EventRequest payload expected by Java API
export async function createEventRequest(data: CreateEventRequest, _accessToken?: string) {
  const response = await fetch(`/api/events`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to create event')
  }

  return response.json()
}

export interface GetEventsResponse {
  events: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getEvents(params: GetEventsParams = {}, accessToken?: string): Promise<GetEventsResponse> {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    status,
    eventMode,
    fromDate,
    toDate,
    sortBy,
    sortDir
  } = params
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(status && { status }),
    ...(eventMode && { eventMode }),
    ...(fromDate && { fromDate }),
    ...(toDate && { toDate }),
    ...(sortBy && { sortBy }),
    ...(sortDir && { sortDir }),
  })

  console.log(`🔍 Fetching events from: ${API_URL}/events?${queryParams}`)
  const response = await fetch(`${API_URL}/events?${queryParams}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  console.log(`📡 Response status: ${response.status}`)
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ Failed to fetch events: ${response.status} - ${errorText}`)
    throw new Error('Failed to fetch events')
  }

  const data = await response.json()
  console.log(`📊 Received data:`, data)
  if (data && Array.isArray(data.content)) {
    return {
      events: data.content,
      total: typeof data.totalElements === 'number' ? data.totalElements : data.content.length,
      page: typeof data.number === 'number' ? data.number + 1 : 1,
      limit: typeof data.size === 'number' ? data.size : data.content.length,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
    }
  }
  if (Array.isArray(data)) {
    return {
      events: data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    }
  }
  return { events: [], total: 0, page: 1, limit: 0, totalPages: 0 }
}

export async function getEventById(id: string, accessToken?: string): Promise<Event> {
  const response = await fetch(`${API_URL}/events/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch event')
  }

  return response.json()
}

export async function cancelEvent(id: string, _accessToken?: string): Promise<Event> {
  const response = await fetch(`/api/events/${id}/cancel`, { method: 'PATCH', credentials: 'include' })
  if (!response.ok) throw new Error('Failed to cancel event')
  return response.json()
}

export async function trashEvent(id: string, _accessToken?: string): Promise<Event> {
  const response = await fetch(`/api/events/${id}/trash`, { method: 'PATCH', credentials: 'include' })
  if (!response.ok) throw new Error('Failed to move event to trash')
  return response.json()
}

export async function restoreEvent(id: string, _accessToken?: string): Promise<Event> {
  const response = await fetch(`/api/events/${id}/restore`, { method: 'PATCH', credentials: 'include' })
  if (!response.ok) throw new Error('Failed to restore event')
  return response.json()
}

export async function getEventAttendees(eventId: string, params: { page?: number; limit?: number } = {}, accessToken?: string) {
  const { page = 1, limit = 10 } = params
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  const response = await fetch(`${API_URL}/events/${eventId}/attendees?${queryParams}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch event attendees')
  }

  return response.json()
}
