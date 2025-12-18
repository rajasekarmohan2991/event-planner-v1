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
  } catch { }
  try {
    const anyActive = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' }, select: { id: true } })
    if (anyActive?.id) return anyActive.id
  } catch { }
  return undefined
}

export async function POST(req: NextRequest) {
  // Check permission for creating events
  const permissionError = await checkPermissionInRoute('events.create')
  if (permissionError) {
    console.error('❌ Permission denied for events.create')
    return permissionError
  }

  const session = await getServerSession(authOptions as any) as any
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Parse incoming JSON safely
  const raw = await req.text()
  let incoming: any = {}
  try {
    incoming = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const sanitizeNum = (v: any) => (v === null || v === undefined || v === '' ? undefined : Number(v))
  const sanitizeStr = (v: any) => (v === null || v === undefined ? undefined : String(v))
  const toDate = (v: any) => {
    if (!v) return new Date()
    const d = new Date(v)
    return isNaN(d.getTime()) ? new Date() : d
  }

  // Resolve Tenant ID
  const tenantId = await resolveTenantId(session, req)

  // Default values
  const name = sanitizeStr(incoming.name) || 'Untitled Event'
  const startsAt = toDate(incoming.startsAt || incoming.startDate)
  const endsAt = toDate(incoming.endsAt || incoming.endDate)

  if (endsAt < startsAt) {
    // Basic validation fix
    endsAt.setTime(startsAt.getTime() + 3600000) // +1 hour
  }

  try {
    console.log(`📝 Creating event via Prisma: "${name}" for Tenant: ${tenantId}`)

    const event = await prisma.event.create({
      data: {
        name,
        description: sanitizeStr(incoming.description),
        startsAt,
        endsAt,
        status: 'DRAFT', // Default to DRAFT
        venue: sanitizeStr(incoming.venue) || 'TBD',
        address: sanitizeStr(incoming.address),
        city: sanitizeStr(incoming.city) || 'Mumbai',
        priceInr: sanitizeNum(incoming.priceInr) ?? 0,
        bannerUrl: sanitizeStr(incoming.bannerUrl || incoming.imageUrl),
        category: (sanitizeStr(incoming.category) || 'CONFERENCE').toUpperCase(),
        eventMode: (sanitizeStr(incoming.eventMode) || 'IN_PERSON').toUpperCase(),
        budgetInr: sanitizeNum(incoming.budgetInr),
        expectedAttendees: sanitizeNum(incoming.expectedAttendees ?? incoming.capacity),
        tenantId: tenantId, // CRITICAL: Link to tenant
        termsAndConditions: sanitizeStr(incoming.termsAndConditions),

        // Manager info
        eventManagerName: sanitizeStr(incoming.eventManagerName),
        eventManagerContact: sanitizeStr(incoming.eventManagerContact),
        eventManagerEmail: sanitizeStr(incoming.eventManagerEmail),

        // Legal
        disclaimer: sanitizeStr(incoming.disclaimer),
      }
    })

    console.log('✅ Event created successfully:', event.id)

    // Convert BigInt to string for response
    const safeEvent = {
      ...event,
      id: String(event.id)
    }

    // Log activity
    logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: ActivityActions.EVENT_CREATED,
      entityType: EntityTypes.EVENT,
      entityId: safeEvent.id,
      entityName: safeEvent.name,
      description: `Event "${safeEvent.name}" was created`,
      metadata: { eventId: safeEvent.id },
      tenantId,
    }).catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json(safeEvent)
  } catch (e: any) {
    console.error('❌ Prisma Create Event Error:', e)
    return NextResponse.json({ message: e?.message || 'Create failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Check permission for viewing events (optional)
  // const permissionError = await checkPermissionInRoute('events.view')
  // if (permissionError) return permissionError

  const session = await getServerSession(authOptions as any) as any
  const url = new URL(req.url)
  const isMyEvents = url.searchParams.get('my') === 'true'
  const search = url.searchParams.get('search')
  const statusParam = url.searchParams.get('status')
  const modeParam = url.searchParams.get('eventMode')
  const sortBy = url.searchParams.get('sortBy') || 'startsAt'
  const sortDir = url.searchParams.get('sortDir') || 'desc'
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  try {
    const userRole = (session as any)?.user?.role as string | undefined
    const userId = (session as any)?.user?.id
    // effective tenant for admin views
    const tenantId = (session as any)?.user?.currentTenantId

    console.log(`🔍 GET /api/events (Prisma) - User: ${session?.user?.email}, Role: ${userRole}, Tenant: ${tenantId}`)

    const where: any = {}

    // 1. Role-based filtering
    if (userRole === 'SUPER_ADMIN') {
      // Super Admin sees ALL events.
      console.log('✅ SUPER_ADMIN detected - No tenant filtering applied')
    } else if (['TENANT_ADMIN', 'EVENT_MANAGER', 'OWNER', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
      // Company/Tenant Admin sees ONLY their company's events
      if (tenantId) {
        where.tenantId = tenantId
        console.log(`🏢 Tenant Admin - Filtering by tenantId: ${tenantId}`)
        // If they want "my events", it just means their tenant's events in this context
      } else {
        where.tenantId = 'non-existent-tenant' // blocked
        console.log('⚠️ Tenant Admin without tenantId - Blocking access')
      }
    } else {
      // Regular User / Public / Staff
      // Should see Public events
      if (isMyEvents && userId) {
        // Since 'createdBy' doesn't exist on Event model, we cannot easy filter by creator.
        // If 'my events' means 'events I am attending':
        const registrations = await prisma.registration.findMany({
          where: { userId: BigInt(userId) },
          select: { eventId: true }
        })
        const registeredEventIds = registrations.map(r => r.eventId)
        where.id = { in: registeredEventIds }
        console.log(`👤 User "My Events" - ${registeredEventIds.length} registered events`)
      } else {
        // Public/Discovery mode
        where.status = { in: ['LIVE', 'PUBLISHED', 'UPCOMING', 'COMPLETED'] }
        console.log('🌍 Public mode - Filtering by published statuses')
      }
    }

    // 2. Apply Filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } }
      ]
      console.log(`🔎 Search filter applied: "${search}"`)
    }

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam
      console.log(`📊 Status filter: ${statusParam}`)
    }

    if (modeParam && modeParam !== 'ALL') {
      where.eventMode = modeParam
      console.log(`🎭 Mode filter: ${modeParam}`)
    }

    console.log('📋 Final where clause:', JSON.stringify(where, null, 2))

    // 3. Execute Query
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: {
          [sortBy]: sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.event.count({ where })
    ])

    console.log(`📊 Query results: Found ${events.length} events (Total: ${total})`)

    // 4. Get Registration Counts
    const eventIds = events.map(e => e.id)
    let registrationCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      const counts = await prisma.registration.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: eventIds }
        },
        _count: {
          eventId: true
        }
      })
      counts.forEach(c => {
        registrationCounts[String(c.eventId)] = c._count.eventId
      })
    }

    // 5. Transform for Frontend
    const formattedEvents = events.map(event => {
      // Calculate derived status if needed
      const now = new Date()
      let derivedStatus = event.status
      // Logic for status derivation
      if (['PUBLISHED', 'UPCOMING'].includes(event.status)) {
        if (now > event.endsAt) derivedStatus = 'COMPLETED'
        else if (now >= event.startsAt && now <= event.endsAt) derivedStatus = 'LIVE'
      }

      return {
        ...event,
        id: String(event.id), // Ensure ID is string for frontend
        status: derivedStatus,
        startDate: event.startsAt,
        endDate: event.endsAt,
        location: event.city || event.venue,
        bannerImage: event.bannerUrl,
        registrationCount: registrationCounts[String(event.id)] || 0
      }
    })

    return NextResponse.json({
      content: formattedEvents,
      events: formattedEvents,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
      number: page - 1,
      size: limit
    })

  } catch (e: any) {
    console.error('❌ Prisma Events API error:', e)
    return NextResponse.json({ message: e?.message || 'List failed' }, { status: 500 })
  }
}
