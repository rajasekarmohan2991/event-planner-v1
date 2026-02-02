import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  
  const role = String(((session as any).user?.role) || '')
  if (!['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const accessToken = (session as any)?.accessToken as string | undefined
  const url = new URL(req.url)
  const qp = url.search ? url.search : ''

  try {
    const headers: Record<string, string> = {}
    
    // Tenant and role headers for Java API
    const inboundTenant = req.headers.get('x-tenant-id') || undefined
    const tenantId = ((session as any)?.user?.currentTenantId as string | undefined) || inboundTenant || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    
    if (tenantId) headers['x-tenant-id'] = tenantId
    if (role) headers['x-user-role'] = role
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const res = await fetch(`${API_BASE}/events${qp}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    })

    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})

    if (!res.ok) {
      return NextResponse.json(payload || { message: 'Failed to fetch events' }, { status: res.status })
    }

    // Transform Java API response to match frontend expectations
    const events = Array.isArray(payload) ? payload : (payload.events || payload.content || [])
    
    return NextResponse.json({
      page: 1,
      limit: 100,
      total: events.length,
      events: events.map((event: any) => ({
        id: event.id,
        name: event.name || event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        city: event.city,
        status: event.status || 'PUBLISHED',
        maxCapacity: event.maxCapacity,
        registrationCount: event.registrationCount || 0,
        createdAt: event.createdAt,
        organizer: {
          name: event.organizerName || 'Unknown',
          email: event.organizerEmail || ''
        }
      }))
    })

  } catch (error: any) {
    console.error('Error fetching events from Java API:', error)
    return NextResponse.json(
      { message: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
