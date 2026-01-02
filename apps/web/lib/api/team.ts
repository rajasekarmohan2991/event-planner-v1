export type TeamMember = {
  id: number
  eventId: number
  name: string
  email: string
  role: string
  status: 'INVITED' | 'JOINED' | 'REJECTED' | string
  invitedAt?: string
  joinedAt?: string
  progress?: number
}

// Always use local Next.js API proxy so server can attach Authorization
const API_URL = '/api'

export async function listTeamMembers(
  eventId: string,
  params: { page?: number; limit?: number; q?: string; sortBy?: 'name' | 'email' | 'role' | 'status' | 'invitedAt' | 'joinedAt'; sortDir?: 'ASC' | 'DESC' } = {},
  accessToken?: string
): Promise<{ items: TeamMember[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page = 1, limit = 10, q, sortBy, sortDir } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...(q ? { q } : {}), ...(sortBy ? { sortBy } : {}), ...(sortDir ? { sortDir } : {}) })
  const res = await fetch(`${API_URL}/events/${eventId}/team/members?${query}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
  if (!res.ok) throw new Error('Failed to load team members')
  const data = await res.json()
  if (data && Array.isArray(data.content)) {
    return {
      items: data.content,
      total: typeof data.totalElements === 'number' ? data.totalElements : data.content.length,
      page: typeof data.number === 'number' ? data.number + 1 : 1,
      limit: typeof data.size === 'number' ? data.size : data.content.length,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
    }
  }
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: typeof data.total === 'number' ? data.total : data.items.length,
      page: typeof data.page === 'number' ? data.page : 1,
      limit: typeof data.limit === 'number' ? data.limit : data.items.length,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
    }
  }
  return { items: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0, page: 1, limit, totalPages: 1 }
}

export async function inviteTeamMembers(eventId: string, emails: string[], role: string, accessToken?: string): Promise<TeamMember[]> {
  const res = await fetch(`${API_URL}/events/${eventId}/team/invite`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ emails, role }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = 'Invite failed'
    try { const j = text ? JSON.parse(text) : null; msg = j?.message || msg } catch { }
    throw new Error(msg)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : []
}

export async function reinviteTeamMember(eventId: string, email: string, accessToken?: string): Promise<void> {
  const query = new URLSearchParams({ email })
  const res = await fetch(`${API_URL}/events/${eventId}/team/reinvite?${query}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = 'Reinvite failed'
    try { const j = text ? JSON.parse(text) : null; msg = j?.message || msg } catch { }
    throw new Error(msg)
  }
  // No need to consume body; treat as success
  return
}

export async function approveTeamMember(eventId: string, email: string, accessToken?: string): Promise<void> {
  const query = new URLSearchParams({ email })
  const res = await fetch(`${API_URL}/events/${eventId}/team/approve?${query}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = 'Approve failed'
    try { const j = text ? JSON.parse(text) : null; msg = j?.message || msg } catch { }
    throw new Error(msg)
  }
  // Success, nothing to return
  return
}

export async function updateTeamMember(
  eventId: string,
  memberId: number,
  opts: { role?: string; status?: 'INVITED' | 'JOINED' | 'REJECTED' },
  accessToken?: string
): Promise<TeamMember> {
  const params = new URLSearchParams({
    ...(opts.role ? { role: opts.role } : {}),
    ...(opts.status ? { status: opts.status } : {}),
  })
  const res = await fetch(`${API_URL}/events/${eventId}/team/members/${memberId}?${params}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = 'Update failed'
    try { const j = text ? JSON.parse(text) : null; msg = j?.message || msg } catch { }
    throw new Error(msg)
  }
  const json = await res.json().catch(() => null)
  if (!json) throw new Error('Malformed server response')
  return json as TeamMember
}

export async function deleteTeamMember(eventId: string, memberId: string | number, accessToken?: string): Promise<void> {
  const url = `${API_URL}/events/${eventId}/team/members/${memberId}`
  console.log('DELETE request to:', url, 'with token:', accessToken ? 'present' : 'missing')
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
  console.log('DELETE response status:', res.status, res.statusText)
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Team member not found (ID: ${memberId})`)
    }
    if (res.status === 403) {
      throw new Error('Access denied. You must be logged in to remove team members.')
    }
    if (res.status === 401) {
      throw new Error('Unauthorized. Please log in again.')
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Delete failed')
  }
}
