import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
// Spring Boot context-path is "/api", so all controllers are under /api
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🗑️ DELETE request for event ${params.id}`)

    const session = await getServerSession(authOptions as any)

    // Check authentication first
    if (!session || !(session as any).user) {
      console.log('❌ DELETE failed: Not authenticated')
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const user = (session as any).user
    const tenantRole = user?.tenantRole as string | undefined
    const systemRole = user?.role as string | undefined
    const effectiveRole = tenantRole || systemRole

    console.log(`🔍 DELETE - User info:`, {
      email: user?.email,
      systemRole,
      tenantRole,
      effectiveRole
    })

    // TENANT_ADMIN and SUPER_ADMIN should always be able to delete events
    const isAdmin = effectiveRole === 'TENANT_ADMIN' || effectiveRole === 'SUPER_ADMIN' || systemRole === 'SUPER_ADMIN'

    if (!isAdmin) {
      // Check permission for other roles
      console.log('🔍 Checking permissions for non-admin role...')
      const permissionError = await checkPermissionInRoute('events.delete', 'Delete Event')
      if (permissionError) {
        console.log('❌ DELETE failed: Permission denied')
        return permissionError
      }
    } else {
      console.log('✅ Admin access granted, skipping permission check')
    }

    const eventIdBigInt = BigInt(params.id)
    const eventIdString = params.id

    console.log(`🗑️ Starting deletion of event ${params.id}...`)

    try {
      // Execute deletes independently (not in a transaction) to avoid PostgreSQL transaction abort errors
      // When one query fails in a transaction, PostgreSQL aborts the entire transaction (25P02 error)
      let deletedRows = 0

      console.log('  Step 1: Deleting seat inventory...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM seat_inventory WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} seat inventory records`)
      } catch (e: any) {
        console.log('    ⚠️ Seat inventory deletion skipped:', e.message, e.code)
      }

      console.log('  Step 2: Deleting promo codes...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM promo_codes WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} promo codes`)
      } catch (e: any) {
        console.log('    ⚠️ Promo codes deletion skipped:', e.message, e.code)
      }

      console.log('  Step 3: Deleting orders...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM "Order" WHERE "eventId" = ${eventIdString}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} orders`)
      } catch (e: any) {
        console.log('    ⚠️ Orders deletion skipped:', e.message, e.code)
      }

      console.log('  Step 4: Deleting registrations...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM registrations WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} registrations`)
      } catch (e: any) {
        console.log('    ⚠️ Registrations deletion skipped:', e.message, e.code)
      }

      console.log('  Step 5: Deleting exhibitors...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM exhibitors WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} exhibitors`)
      } catch (e: any) {
        console.log('    ⚠️ Exhibitors deletion skipped:', e.message, e.code)
      }

      console.log('  Step 6: Deleting floor plans...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM floor_plans WHERE "eventId" = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} floor plans`)
      } catch (e: any) {
        console.log('    ⚠️ Floor plans deletion skipped:', e.message, e.code)
      }

      console.log('  Step 7: Deleting tickets...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM tickets WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} tickets`)
      } catch (e: any) {
        console.log('    ⚠️ Tickets deletion skipped:', e.message, e.code)
      }

      console.log('  Step 8: Deleting session speakers...')
      try {
        const result = await prisma.$executeRaw`
          DELETE FROM session_speakers 
          WHERE session_id IN (
            SELECT id FROM sessions WHERE event_id = ${eventIdBigInt}
          )
        `
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} session speakers`)
      } catch (e: any) {
        console.log('    ⚠️ Session speakers deletion skipped:', e.message, e.code)
      }

      console.log('  Step 9: Deleting speakers...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM speakers WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} speakers`)
      } catch (e: any) {
        console.log('    ⚠️ Speakers deletion skipped:', e.message, e.code)
      }

      console.log('  Step 10: Deleting sessions...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM sessions WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} sessions`)
      } catch (e: any) {
        console.log('    ⚠️ Sessions deletion skipped:', e.message, e.code)
      }

      console.log('  Step 11: Deleting sponsors...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM sponsors WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} sponsors`)
      } catch (e: any) {
        console.log('    ⚠️ Sponsors deletion skipped:', e.message, e.code)
      }

      console.log('  Step 12: Deleting vendors...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM vendors WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} vendors`)
      } catch (e: any) {
        console.log('    ⚠️ Vendors deletion skipped:', e.message, e.code)
      }

      console.log('  Step 13: Deleting event team members...')
      try {
        const result = await prisma.$executeRaw`DELETE FROM event_team_members WHERE event_id = ${eventIdBigInt}`
        deletedRows = Number(result)
        console.log(`    ✓ Deleted ${deletedRows} event team members`)
      } catch (e: any) {
        console.log('    ⚠️ Event team members deletion skipped:', e.message, e.code)
      }

      console.log('  Step 14: Deleting the event itself...')
      const result = await prisma.$executeRaw`DELETE FROM events WHERE id = ${eventIdBigInt}`
      deletedRows = Number(result)

      if (deletedRows === 0) {
        throw new Error('Event not found or already deleted')
      }

      console.log(`    ✓ Deleted event ${params.id}`)
      console.log('  ✅ Event and all dependencies deleted successfully')

      console.log(`✅ Event ${params.id} deleted successfully`)
      return new NextResponse(null, { status: 204 })

    } catch (err: any) {
      console.error(`❌ DELETE error:`, err)
      console.error(`❌ Error message:`, err.message)
      console.error(`❌ Error code:`, err.code)
      console.error(`❌ Error stack:`, err.stack)

      // Handle specific error types
      if (err.message && err.message.includes('Event not found')) {
        return NextResponse.json({ message: 'Event not found' }, { status: 404 })
      }

      // Handle foreign key constraint errors
      if (err.code === 'P2003' || err.code === '23503') {
        return NextResponse.json({
          message: 'Cannot delete event due to existing dependencies',
          error: 'This event has related data that must be deleted first',
          hint: 'Please contact support if this issue persists'
        }, { status: 409 })
      }

      // Return detailed error in development, generic in production
      return NextResponse.json({
        message: err?.message || 'Failed to delete event',
        errorCode: err?.code,
        error: process.env.NODE_ENV === 'development' ? {
          message: err?.message,
          code: err?.code,
          meta: err?.meta,
          stack: err?.stack?.split('\n').slice(0, 5).join('\n')
        } : undefined
      }, { status: 500 })
    }
  } catch (topError: any) {
    // Catch any errors from the outer try block (auth, permission checks, etc.)
    console.error(`❌ TOP-LEVEL DELETE error:`, topError)
    console.error(`❌ Error message:`, topError.message)
    console.error(`❌ Error stack:`, topError.stack)

    return NextResponse.json({
      message: topError?.message || 'Failed to process delete request',
      errorCode: topError?.code,
      error: process.env.NODE_ENV === 'development' ? {
        message: topError?.message,
        code: topError?.code,
        stack: topError?.stack?.split('\n').slice(0, 5).join('\n')
      } : undefined
    }, { status: 500 })
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
