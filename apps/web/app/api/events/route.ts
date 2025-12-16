import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activity'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
// Spring Boot context-path is "/api", so all controllers are under /api
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

async function resolveTenantId(session: any, req: NextRequest): Promise<string | undefined> {
  const inboundTenant = req.headers.get('x-tenant-id') || undefined
  const fromSession = (session as any)?.user?.currentTenantId as string | undefined
  const fromEnv = process.env.DEFAULT_TENANT_ID || undefined
  if (fromSession) return fromSession
  if (inboundTenant) return inboundTenant
  if (fromEnv) return fromEnv
  try {
    const superAdmin = await prisma.tenant.findUnique({ where: { slug: 'super-admin' }, select: { id: true } })
    if (superAdmin?.id) return superAdmin.id
  } catch {}
  try {
    const anyActive = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' }, select: { id: true } })
    if (anyActive?.id) return anyActive.id
  } catch {}
  return undefined
}

export async function POST(req: NextRequest) {
  // Check permission for creating events
  const permissionError = await checkPermissionInRoute('events.create')
  if (permissionError) {
    console.error('❌ Permission denied for events.create')
    return permissionError
  }

  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  // Parse incoming JSON safely and sanitize to match Java API expectations
  const raw = await req.text()
  let incoming: any = {}
  try {
    incoming = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }
  const sanitizeNum = (v: any) => (v === null || v === undefined || v === '' ? undefined : Number(v))
  const sanitizeStr = (v: any) => (v === null || v === undefined ? undefined : String(v))
  const toIso = (v: any) => {
    try {
      if (!v) return undefined
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return undefined
      return d.toISOString()
    } catch {
      return undefined
    }
  }
  // Build sanitized payload aligned with Java EventRequest
  const payload = {
    name: sanitizeStr(incoming.name) || 'Untitled Event',
    venue: sanitizeStr(incoming.venue) || 'TBD',
    address: sanitizeStr(incoming.address),
    city: sanitizeStr(incoming.city) || 'Mumbai',
    startsAt: toIso(incoming.startsAt || incoming.startDate),
    endsAt: toIso(incoming.endsAt || incoming.endDate),
    priceInr: sanitizeNum(incoming.priceInr) ?? 0,
    description: sanitizeStr(incoming.description),
    bannerUrl: sanitizeStr(incoming.bannerUrl || incoming.imageUrl),
    category: (sanitizeStr(incoming.category) || 'CONFERENCE')!.toUpperCase(),
    eventMode: (sanitizeStr(incoming.eventMode) || 'IN_PERSON')!.toUpperCase(),
    budgetInr: sanitizeNum(incoming.budgetInr),
    expectedAttendees: sanitizeNum(incoming.expectedAttendees ?? incoming.capacity),
    termsAndConditions: sanitizeStr(incoming.termsAndConditions),
    disclaimer: sanitizeStr(incoming.disclaimer),
    eventManagerName: sanitizeStr(incoming.eventManagerName),
    eventManagerContact: sanitizeStr(incoming.eventManagerContact),
    eventManagerEmail: sanitizeStr(incoming.eventManagerEmail),
  }
  
  console.log('📝 POST /api/events')
  console.log('👤 User:', (session as any)?.user?.email, 'Role:', (session as any)?.user?.role)
  try {
    const keys = Object.keys(payload).filter((k) => (payload as any)[k] !== undefined)
    console.log('📦 Sanitized keys:', keys)
  } catch {}
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    // Tenant and role headers for Java API (robust fallback)
    const tenantId = await resolveTenantId(session, req)
    const tenantRole = (session as any)?.user?.tenantRole as string | undefined
    const role = tenantRole || ((session as any)?.user?.role as string | undefined)
    if (tenantId) headers['x-tenant-id'] = tenantId
    if (role) headers['x-user-role'] = role
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    
    console.log('🔑 Headers:', { tenantId, role, hasToken: !!accessToken })
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for Java Backend

    console.log('🌐 Calling:', `${API_BASE}/events`)
    
    const res: Response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    const text: string = await res.text()
    const isJson: boolean = (res.headers.get('content-type') || '').includes('application/json')
    const resPayload: any = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    
    console.log('📊 Java API Response:', res.status, resPayload)
    
    if (!res.ok) {
      console.error('❌ Java API Error:', res.status, resPayload)
      return NextResponse.json(resPayload || { message: 'Create failed' }, { status: res.status })
    }
    
    console.log('✅ Event created successfully:', resPayload?.id)
    
    // Log activity
    logActivity({
      userId: (session as any)?.user?.id,
      userName: (session as any)?.user?.name,
      userEmail: (session as any)?.user?.email,
      action: ActivityActions.EVENT_CREATED,
      entityType: EntityTypes.EVENT,
      entityId: resPayload?.id?.toString(),
      entityName: resPayload?.name || 'New Event',
      description: `Event "${resPayload?.name || 'New Event'}" was created`,
      metadata: { eventId: resPayload?.id },
      tenantId,
    }).catch(err => console.error('Failed to log activity:', err))
    
    return NextResponse.json(resPayload)
  } catch (e: any) {
    console.error('❌ Exception in POST /api/events:', e)
    return NextResponse.json({ message: e?.message || 'Create failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Check permission for viewing events
  const permissionError = await checkPermissionInRoute('events.view')
  if (permissionError) return permissionError

  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  const url = new URL(req.url)
  const isMyEvents = url.searchParams.get('my') === 'true'
  
  try {
    const headers: Record<string, string> = {}
    const tenantId = await resolveTenantId(session, req)
    const role = (session as any)?.user?.role as string | undefined
    const userId = (session as any)?.user?.id
    
    console.log(`🔍 GET /api/events - tenant: ${tenantId}, role: ${role}, user: ${(session as any)?.user?.email}, my: ${isMyEvents}`)
    
    if (tenantId) headers['x-tenant-id'] = tenantId
    if (role) headers['x-user-role'] = role
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    
    // If requesting user's own events, add user filter
    let apiUrl = `${API_BASE}/events`
    if (isMyEvents && userId) {
      const params = new URLSearchParams(url.searchParams)
      params.set('createdBy', userId)
      apiUrl += `?${params.toString()}`
    } else {
      apiUrl += url.search || ''
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const res = await fetch(apiUrl, {
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    
    console.log(`📊 API Response: status=${res.status}, events=${payload?.content?.length || 0}`)
    
    if (!res.ok) return NextResponse.json(payload || { message: 'List failed' }, { status: res.status })
    
    // Get registration counts for all events
    const eventIds = (payload?.content || payload || []).map((e: any) => parseInt(e.id)).filter((id: number) => !isNaN(id))
    let registrationCounts: Record<number, number> = {}
    
    if (eventIds.length > 0) {
      try {
        const counts = await prisma.$queryRaw<any[]>`
          SELECT event_id, COUNT(*)::int as count
          FROM registrations
          WHERE event_id = ANY(${eventIds}::bigint[])
            AND tenant_id = ${tenantId}
          GROUP BY event_id
        `
        registrationCounts = counts.reduce((acc: any, row: any) => {
          acc[row.event_id] = row.count
          return acc
        }, {})
      } catch (e) {
        console.error('Failed to fetch registration counts:', e)
      }
    }
    
    // Transform the response to match frontend expectations
    // Filter out TRASHED events unless explicitly requested
    const showTrashed = url.searchParams.get('showTrashed') === 'true'
    const allEvents = payload?.content || payload || []
    
    const events = allEvents
      .map((raw: any) => ({
        ...raw,
        status: (raw.status || '').toUpperCase(),
      }))
      .filter((event: any) => showTrashed || event.status !== 'TRASHED')
      .map((event: any) => {
        const startDate = new Date(event.startsAt || event.startDate)
        const endDate = new Date(event.endsAt || event.endDate)
        const now = new Date()
        
        // Determine actual status based on dates
        let actualStatus = event.status
        if (event.status !== 'DRAFT' && event.status !== 'CANCELLED' && event.status !== 'TRASHED') {
          if (now < startDate) {
            actualStatus = 'UPCOMING'
          } else if (now >= startDate && now <= endDate) {
            actualStatus = 'LIVE'
          } else {
            actualStatus = 'COMPLETED'
          }
        }
        
        return {
          ...event,
          // Map Java API fields to frontend expected fields
          startDate: event.startsAt || event.startDate,
          endDate: event.endsAt || event.endDate,
          location: event.city || event.venue || event.location || 'No location',
          bannerImage: event.bannerUrl || event.bannerImage || null,
          priceInr: event.priceInr || event.price_inr || 0,
          capacity: event.expectedAttendees || event.capacity || event.seats || event.maxCapacity || 0,
          status: actualStatus, // normalized & calculated
          // Add registration count
          registrationCount: registrationCounts[parseInt(event.id)] || 0
        }
      })
    
    const response = {
      events,
      totalElements: payload?.totalElements || events.length,
      totalPages: payload?.totalPages || 1,
      currentPage: payload?.number || 0
    }
    
    return NextResponse.json(response)
  } catch (e: any) {
    console.error('Events API error:', e)
    return NextResponse.json({ message: e?.message || 'List failed' }, { status: 500 })
  }
}
