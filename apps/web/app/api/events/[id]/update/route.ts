import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check permission for editing events
    const permissionCheck = await checkPermissionInRoute('events.edit', 'Update Event')
    if (permissionCheck) return permissionCheck

    const session = await getServerSession(authOptions as any)
    
    // Check authentication
    if (!session || !(session as any).user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    // Validate event ID is numeric (Java API and DB expect numeric IDs)
    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json({ message: 'Invalid event ID. Event ID must be numeric.' }, { status: 400 })
    }
    const body = await req.json()
    
    console.log(`🔄 Direct DB UPDATE /api/events/${eventId}/update - User: ${(session as any)?.user?.email}`)
    console.log(`📋 Update data:`, body)

    // Validate required fields
    if (!body.name || !body.startsAt) {
      return NextResponse.json({ message: 'Name and start date are required' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      name: body.name,
      description: body.description || null,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      venue: body.venue || null,
      city: body.city || null,
      eventMode: body.eventMode || 'OFFLINE',
      expectedAttendees: body.expectedAttendees ? parseInt(body.expectedAttendees) : null,
      priceInr: body.priceInr ? parseFloat(body.priceInr) : null,
      status: body.status || 'DRAFT',
      updatedAt: new Date()
    }

    // Add optional fields if provided
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null

    // Update the event in database using raw SQL
    await prisma.$executeRaw`
      UPDATE events 
      SET 
        name = ${updateData.name},
        description = ${updateData.description},
        starts_at = ${updateData.startsAt},
        ends_at = ${updateData.endsAt},
        venue = ${updateData.venue},
        city = ${updateData.city},
        event_mode = ${updateData.eventMode},
        expected_attendees = ${updateData.expectedAttendees},
        price_inr = ${updateData.priceInr},
        status = ${updateData.status},
        latitude = ${updateData.latitude},
        longitude = ${updateData.longitude},
        updated_at = NOW()
      WHERE id = ${eventId}
    `

    // Get the updated event
    const updatedEventResult = await prisma.$queryRaw`
      SELECT 
        id::text,
        name,
        description,
        starts_at as "startsAt",
        ends_at as "endsAt",
        venue,
        city,
        event_mode as "eventMode",
        expected_attendees::text as "expectedAttendees",
        price_inr::numeric as "priceInr",
        status,
        latitude::numeric,
        longitude::numeric,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM events 
      WHERE id = ${eventId}
      LIMIT 1
    `
    
    const updatedEvent = (updatedEventResult as any[])[0]

    console.log(`✅ Event updated successfully in database`)
    
    return NextResponse.json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      description: updatedEvent.description,
      startsAt: updatedEvent.startsAt,
      endsAt: updatedEvent.endsAt,
      venue: updatedEvent.venue,
      city: updatedEvent.city,
      eventMode: updatedEvent.eventMode,
      expectedAttendees: updatedEvent.expectedAttendees,
      priceInr: updatedEvent.priceInr,
      status: updatedEvent.status,
      latitude: updatedEvent.latitude,
      longitude: updatedEvent.longitude,
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt
    })

  } catch (error: any) {
    console.error('❌ Direct DB update error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: error?.message || 'Failed to update event',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
