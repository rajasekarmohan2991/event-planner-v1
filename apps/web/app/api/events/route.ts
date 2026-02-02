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

  // ============================================
  // PHASE 3: DATE/TIME VALIDATION
  // ============================================

  const now = new Date()

  // 1. Start date must be in the future (allow creating events for today)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (startsAt < startOfToday) {
    return NextResponse.json({
      message: 'Event start date cannot be in the past',
      details: {
        provided: startsAt.toISOString(),
        minimum: startOfToday.toISOString()
      }
    }, { status: 400 })
  }

  // 2. End date must be after start date
  if (endsAt <= startsAt) {
    return NextResponse.json({
      message: 'Event end date must be after start date',
      details: {
        startDate: startsAt.toISOString(),
        endDate: endsAt.toISOString()
      }
    }, { status: 400 })
  }

  // 3. Reasonable duration check (max 365 days)
  const durationMs = endsAt.getTime() - startsAt.getTime()
  const durationDays = durationMs / (1000 * 60 * 60 * 24)

  if (durationDays > 365) {
    return NextResponse.json({
      message: 'Event duration cannot exceed 365 days',
      details: {
        duration: `${Math.round(durationDays)} days`,
        maximum: '365 days'
      }
    }, { status: 400 })
  }

  // 4. Minimum duration check (at least 1 hour)
  const durationHours = durationMs / (1000 * 60 * 60)

  if (durationHours < 1) {
    return NextResponse.json({
      message: 'Event must be at least 1 hour long',
      details: {
        duration: `${Math.round(durationHours * 60)} minutes`,
        minimum: '1 hour'
      }
    }, { status: 400 })
  }

  console.log('✅ Event date validation passed:', {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    duration: `${Math.round(durationDays)} days, ${Math.round(durationHours % 24)} hours`
  })

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

    // Automatically add the event creator as "Event Owner"
    try {
      await prisma.eventRoleAssignment.create({
        data: {
          eventId: String(event.id),
          userId: user.id,
          role: 'OWNER', // EventRole enum value
          createdAt: new Date()
        }
      })
      console.log(`✅ Event creator (${user.email}) automatically added as Event OWNER`)
    } catch (roleError: any) {
      console.error('⚠️ Failed to auto-assign Event Owner role:', roleError.message)
      // Don't fail the event creation if role assignment fails
    }

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
  const startTime = Date.now()

  const session = await getServerSession(authOptions as any) as any
  const url = new URL(req.url)
  const isMyEvents = url.searchParams.get('my') === 'true'
  const search = url.searchParams.get('search')
  const statusParam = url.searchParams.get('status')
  const modeParam = url.searchParams.get('eventMode')
  const sortBy = url.searchParams.get('sortBy') || 'startsAt'
  const sortDir = url.searchParams.get('sortDir') || 'desc'
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100) // Cap at 100
  const skip = (page - 1) * limit

  try {
    // Get role from multiple sources - PRIORITIZE session.user.role over tenantRole
    const sessionRole = (session as any)?.user?.role as string | undefined
    const tenantRole = (session as any)?.user?.tenantRole as string | undefined
    const userId = (session as any)?.user?.id
    const tenantId = (session as any)?.user?.currentTenantId

    console.log(`🔍 GET /api/events - User: ${session?.user?.email}, SessionRole: ${sessionRole}, TenantRole: ${tenantRole}, Tenant: ${tenantId}`)
    console.log(`📋 Session exists: ${!!session}, User ID: ${userId}`)
    console.log(`🔑 Full session.user:`, JSON.stringify((session as any)?.user, null, 2))

    const where: any = {}

    // CRITICAL: Check session.user.role FIRST (this is the system-level role)
    // session.user.role = SUPER_ADMIN (platform-wide access)
    // session.user.tenantRole = TENANT_ADMIN (company-specific role)
    const userEmail = session?.user?.email?.toLowerCase() || '';
    const isSuperAdmin = sessionRole?.toUpperCase() === 'SUPER_ADMIN' || userEmail === 'fiserv@gmail.com';

    const isTenantAdmin = tenantRole?.toUpperCase() === 'TENANT_ADMIN' ||
      ['EVENT_MANAGER', 'OWNER', 'ADMIN', 'MANAGER'].includes(tenantRole?.toUpperCase() || '')

    // 1. Role-based filtering - SUPER_ADMIN takes precedence
    if (isSuperAdmin) {
      // SUPER_ADMIN sees ALL platform-level events (no tenant filtering)
      console.log('✅ SUPER_ADMIN detected - Showing ALL platform events (no tenant filter)')

      // CRITICAL FIX: The global Prisma middleware (prisma-tenant-middleware.ts) automatically 
      // injects "where: { tenantId: default }" if tenantId is undefined.
      // We must explicitly set a condition on tenantId to prevents this injection 
      // and allow fetching ALL events.
      where.tenantId = { not: '00000000-0000-0000-0000-000000000000' }

    } else if (isTenantAdmin) {
      // Company/Tenant admins see ONLY their company's events
      if (tenantId) {
        where.tenantId = tenantId
        console.log(`🏢 TENANT_ADMIN - Showing events for tenant: ${tenantId}`)
      } else {
        // If no tenantId, show all events for admins (fallback)
        console.log(`⚠️ TENANT_ADMIN - No tenantId, showing all events as fallback`)
      }
    } else {
      if (isMyEvents && userId) {
        const registrations = await prisma.registration.findMany({
          where: { userId: BigInt(userId) },
          select: { eventId: true }
        })
        where.id = { in: registrations.map(r => r.eventId) }
        console.log(`👤 My Events: ${registrations.length} registrations`)
      } else {
        where.status = { in: ['LIVE', 'PUBLISHED', 'UPCOMING', 'COMPLETED'] }
        console.log('🌍 Public mode - published events only')
      }
    }

    // 2. Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
      console.log(`🔎 Search: "${search}"`)
    }
    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam
      console.log(`📊 Status filter: ${statusParam}`)
    }
    if (modeParam && modeParam !== 'ALL') {
      where.eventMode = modeParam
      console.log(`🎭 Mode filter: ${modeParam}`)
    }

    console.log('📋 Final WHERE clause:', JSON.stringify(where, null, 2))

    // 3. Execute optimized query with minimal fields
    console.log('🔍 About to query events with where:', where)
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startsAt: true,
          endsAt: true,
          city: true,
          venue: true,
          address: true,
          bannerUrl: true,
          priceInr: true,
          expectedAttendees: true,
          category: true,
          eventMode: true
        },
        orderBy: { [sortBy]: sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    console.log(`✅ Query completed: Found ${events.length} events out of ${total} total`)
    console.log(`📊 First event:`, events[0] ? { id: events[0].id, name: events[0].name, status: events[0].status } : 'none')

    // 4. Get registration counts in batch
    const eventIds = events.map(e => e.id)
    let registrationCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      const counts = await prisma.registration.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds } },
        _count: { eventId: true }
      })
      counts.forEach(c => {
        registrationCounts[String(c.eventId)] = c._count.eventId
      })
    }

    // 5. Format response
    const formattedEvents = events.map(event => {
      const now = new Date()
      let derivedStatus = event.status

      if (['PUBLISHED', 'UPCOMING'].includes(event.status)) {
        if (now > event.endsAt) derivedStatus = 'COMPLETED'
        else if (now >= event.startsAt && now <= event.endsAt) derivedStatus = 'LIVE'
      }

      return {
        ...event,
        id: String(event.id),
        status: derivedStatus,
        startDate: event.startsAt,
        endDate: event.endsAt,
        location: event.city || event.venue,
        bannerImage: event.bannerUrl,
        registrationCount: registrationCounts[String(event.id)] || 0,
        capacity: event.expectedAttendees || 0
      }
    })

    const duration = Date.now() - startTime
    console.log(`⚡ Query completed in ${duration}ms - ${events.length} events`)

    return NextResponse.json({
      content: formattedEvents,
      events: formattedEvents,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
      number: page - 1,
      size: limit,
      _performance: {
        duration,
        cached: false
      }
    })

  } catch (e: any) {
    console.error('❌ Events API error:', e)
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 })
  }
}
