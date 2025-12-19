import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
// Spring Boot context-path is "/api", so all controllers are under /api
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Check permission for deleting events
  const permissionError = await checkPermissionInRoute('events.delete')
  if (permissionError) return permissionError

  const session = await getServerSession(authOptions as any)

  // Check authentication
  if (!session || !(session as any).user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  // Check authorization - SUPER_ADMIN and ADMIN can delete events
  const tenantRole = (session as any)?.user?.tenantRole as string | undefined
  const role = tenantRole || ((session as any)?.user?.role as string | undefined)
  console.log(`🗑️ DELETE event ${params.id} - User role: ${role}`)

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    console.log(`❌ DELETE denied - role ${role} is not SUPER_ADMIN or ADMIN`)
    return NextResponse.json({ message: 'Only SUPER_ADMIN or ADMIN can delete events' }, { status: 403 })
  }

  const accessToken = (session as any)?.accessToken as string | undefined
  const userId = (session as any)?.user?.id

  try {
    const headers: Record<string, string> = {}
    const inboundTenant = req.headers.get('x-tenant-id') || undefined
    const tenantId = ((session as any)?.user?.currentTenantId as string | undefined) || inboundTenant || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    if (tenantId) headers['x-tenant-id'] = tenantId
    if (role) headers['x-user-role'] = role
    if (userId) headers['x-user-id'] = userId
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    console.log(`📡 Calling DELETE ${API_BASE}/events/${params.id}`, { tenantId, role, userId })

    const res = await fetch(`${API_BASE}/events/${params.id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    })

    console.log(`📊 DELETE response: ${res.status}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.log(`❌ DELETE failed:`, body)
      return NextResponse.json(body || { message: 'Failed to delete event' }, { status: res.status })
    }

    console.log(`✅ Event ${params.id} deleted successfully`)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error(`❌ DELETE error:`, err)
    return NextResponse.json({ message: err?.message || 'Failed to delete event' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined

  // Validate that ID is numeric
  if (isNaN(Number(params.id))) {
    return NextResponse.json({
      message: 'Invalid event ID. Event ID must be numeric.'
    }, { status: 400 })
  }

  const eventId = parseInt(params.id)


  // Use Prisma directly for better performance (Java API was failing/slow)
  try {
    const event = await prisma.$queryRaw`
      SELECT 
        id::text,
        name,
        description,
        event_mode as "eventMode",
        status,
        venue,
        address,
        city,
        starts_at as "startsAt",
        ends_at as "endsAt",
        price_inr as "priceInr",
        banner_url as "bannerUrl",
        category,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM events
      WHERE id = ${eventId}::bigint
      LIMIT 1
    ` as any[]

    if (!event || event.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event[0])
  } catch (err: any) {
    console.error('Prisma fallback also failed:', err)
    return NextResponse.json({ message: err?.message || 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Check permission for editing events
  const permissionError = await checkPermissionInRoute('events.edit')
  if (permissionError) return permissionError

  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  const body = await req.text()

  console.log(`🔄 PUT /api/events/${params.id} - User: ${(session as any)?.user?.email}, Role: ${(session as any)?.user?.role}`)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const inboundTenant = req.headers.get('x-tenant-id') || undefined
    const tenantId = ((session as any)?.user?.currentTenantId as string | undefined) || inboundTenant || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    const tenantRole = (session as any)?.user?.tenantRole as string | undefined
    const role = tenantRole || ((session as any)?.user?.role as string | undefined)
    const userId = (session as any)?.user?.id

    if (tenantId) headers['x-tenant-id'] = tenantId
    if (role) headers['x-user-role'] = role
    if (userId) headers['x-user-id'] = userId
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    console.log(`📡 Calling Java API: ${API_BASE}/events/${params.id}`)
    console.log(`📋 Headers:`, { tenantId, role, userId, hasToken: !!accessToken })

    const res = await fetch(`${API_BASE}/events/${params.id}`, {
      method: 'PUT',
      headers,
      body,
      credentials: 'include',
    })

    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})

    console.log(`📊 Java API Response: status=${res.status}, payload=`, payload)

    if (!res.ok) {
      console.log(`❌ PUT event failed: ${res.status} - ${JSON.stringify(payload)}`)
      return NextResponse.json(payload || { message: 'Failed to update event' }, { status: res.status })
    }

    console.log(`✅ PUT event successful`)
    return NextResponse.json(payload)
  } catch (err: any) {
    console.error('❌ PUT event error:', err)
    return NextResponse.json({ message: err?.message || 'Failed to update event' }, { status: 500 })
  }
}
