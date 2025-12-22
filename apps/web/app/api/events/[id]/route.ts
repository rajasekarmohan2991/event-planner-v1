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

  // Role check is handled by checkPermissionInRoute ('events.delete')
  // TENANT_ADMIN has this permission via middleware
  const tenantRole = (session as any)?.user?.tenantRole as string | undefined
  const role = tenantRole || ((session as any)?.user?.role as string | undefined)
  console.log(`🗑️ DELETE event ${params.id} - User role: ${role}`)

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
        budget_inr as "budgetInr",
        expected_attendees as "expectedAttendees",
        terms_and_conditions as "termsAndConditions",
        disclaimer,
        event_manager_name as "eventManagerName",
        event_manager_contact as "eventManagerContact",
        event_manager_email as "eventManagerEmail",
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
  const user = (session as any)?.user
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  // Validate ID
  if (isNaN(Number(params.id))) {
    return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
  }
  const eventId = BigInt(params.id)

  const raw = await req.text()
  let incoming: any = {}
  try {
    incoming = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const sanitizeNum = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v))
  const sanitizeStr = (v: any) => (v === null || v === undefined ? null : String(v))
  const toDate = (v: any) => (v ? new Date(v) : null)

  const startsAt = toDate(incoming.startsAt || incoming.startDate)
  const endsAt = toDate(incoming.endsAt || incoming.endDate)

  if (startsAt && endsAt) {
    // Relaxed validation: Just start <= end
    if (endsAt < startsAt) {
      return NextResponse.json({
        message: 'Event end date must be after start date',
      }, { status: 400 })
    }
  }

  try {
    console.log(`🔄 Updating event ${params.id} via Raw SQL`)

    // Using Raw SQL to ensure updates work regardless of Tenant Middleware state
    // Maps camelCase inputs to snake_case DB columns

    await prisma.$executeRaw`
      UPDATE events
      SET 
        name = COALESCE(${sanitizeStr(incoming.name)}, name),
        description = COALESCE(${sanitizeStr(incoming.description)}, description),
        starts_at = COALESCE(${startsAt}, starts_at),
        ends_at = COALESCE(${endsAt}, ends_at),
        venue = COALESCE(${sanitizeStr(incoming.venue)}, venue),
        address = COALESCE(${sanitizeStr(incoming.address)}, address),
        city = COALESCE(${sanitizeStr(incoming.city)}, city),
        price_inr = COALESCE(${sanitizeNum(incoming.priceInr)}, price_inr),
        banner_url = COALESCE(${sanitizeStr(incoming.bannerUrl || incoming.imageUrl)}, banner_url),
        category = COALESCE(${sanitizeStr(incoming.category)?.toUpperCase()}, category),
        event_mode = COALESCE(${sanitizeStr(incoming.eventMode)?.toUpperCase()}, event_mode),
        budget_inr = COALESCE(${sanitizeNum(incoming.budgetInr)}, budget_inr),
        expected_attendees = COALESCE(${sanitizeNum(incoming.expectedAttendees)}, expected_attendees),

        terms_and_conditions = COALESCE(${sanitizeStr(incoming.termsAndConditions)}, terms_and_conditions),
        disclaimer = COALESCE(${sanitizeStr(incoming.disclaimer)}, disclaimer),
        event_manager_name = COALESCE(${sanitizeStr(incoming.eventManagerName)}, event_manager_name),
        event_manager_contact = COALESCE(${sanitizeStr(incoming.eventManagerContact)}, event_manager_contact),
        event_manager_email = COALESCE(${sanitizeStr(incoming.eventManagerEmail)}, event_manager_email),

        latitude = COALESCE(${sanitizeNum(incoming.latitude)}, latitude),
        longitude = COALESCE(${sanitizeNum(incoming.longitude)}, longitude),
        updated_at = NOW()
      WHERE id = ${eventId}
    `

    console.log(`✅ Event ${params.id} updated successfully (Raw SQL)`)

    // Fetch updated to return - use snake_case map to camelCase
    const updated = await prisma.$queryRaw`
        SELECT 
            id::text, 
            name, 
            description,
            starts_at as "startsAt", 
            ends_at as "endsAt",
            event_manager_name as "eventManagerName",
            terms_and_conditions as "termsAndConditions",
            disclaimer,
            venue, address, city
        FROM events WHERE id = ${eventId}
    ` as any[]

    const safeEvent = updated[0] ? updated[0] : { id: params.id }

    return NextResponse.json(safeEvent)
  } catch (err: any) {
    console.error('❌ PUT Raw SQL failed:', err)
    return NextResponse.json({ message: err?.message || 'Failed to update event' }, { status: 500 })
  }
}
