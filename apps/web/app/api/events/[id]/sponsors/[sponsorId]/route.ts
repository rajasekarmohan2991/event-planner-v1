import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSponsorForm } from '@/types/sponsor'
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string, sponsorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventId = BigInt(params.id)
    const sponsorId = params.sponsorId // Keep as string (CUID)

    console.log(`[SPONSOR UPDATE] Updating sponsor ${sponsorId} for event ${eventId}`)
    console.log(`[SPONSOR UPDATE] Data:`, JSON.stringify(raw, null, 2))

    // Validate
    const errors = validateSponsorForm(raw)
    if (errors.length > 0) {
      console.error(`[SPONSOR UPDATE] Validation failed:`, errors)
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 })
    }

    // Prepare contact data from raw data
    const contactData = raw.contactData || {
      email: raw.email || null,
      phone: raw.phone || null,
      contactPerson: raw.contactPerson || null
    }

    // Update sponsor table
    console.log(`[SPONSOR UPDATE] Updating sponsors table...`)
    const result = await prisma.$queryRawUnsafe(`
      UPDATE sponsors
      SET
        name = $1,
        tier = $2,
        logo_url = $3,
        website = $4,
        contact_data = $5::jsonb,
        payment_data = $6::jsonb,
        branding_online = $7::jsonb,
        branding_offline = $8::jsonb,
        event_presence = $9::jsonb,
        giveaway_data = $10::jsonb,
        legal_data = $11::jsonb,
        timeline_data = $12::jsonb,
        post_event_data = $13::jsonb,
        updated_at = NOW()
      WHERE id = $14 AND event_id = $15
      RETURNING id
    `,
      raw.name,
      raw.tier || 'BRONZE',
      raw.logoUrl || null,
      raw.website || null,
      JSON.stringify(contactData),
      JSON.stringify(raw.paymentData || {}),
      JSON.stringify(raw.brandingOnline || {}),
      JSON.stringify(raw.brandingOffline || {}),
      JSON.stringify(raw.eventPresence || {}),
      JSON.stringify(raw.giveawayData || {}),
      JSON.stringify(raw.legalData || {}),
      JSON.stringify(raw.timelineData || {}),
      JSON.stringify(raw.postEventData || {}),
      sponsorId,
      eventId
    ) as any[]

    if (result.length === 0) {
      console.error(`[SPONSOR UPDATE] Sponsor not found: ${sponsorId}`)
      return NextResponse.json({ message: 'Sponsor not found' }, { status: 404 })
    }

    console.log(`[SPONSOR UPDATE] Sponsor updated successfully`)

    // Also update/create in vendors table if it exists
    try {
      console.log(`[SPONSOR UPDATE] Syncing to vendors table...`)
      await prisma.$queryRawUnsafe(`
        INSERT INTO vendors (
          id, event_id, name, email, phone, contact_person, 
          logo_url, website, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = $3,
          email = $4,
          phone = $5,
          contact_person = $6,
          logo_url = $7,
          website = $8,
          updated_at = NOW()
      `,
        sponsorId,
        eventId,
        raw.name,
        contactData.email,
        contactData.phone,
        contactData.contactPerson,
        raw.logoUrl || null,
        raw.website || null,
        raw.notes || null
      )
      console.log(`[SPONSOR UPDATE] Synced to vendors table`)
    } catch (vendorError: any) {
      console.warn(`[SPONSOR UPDATE] Failed to sync to vendors:`, vendorError.message)
    }

    // Also update/create in exhibitors table if it exists
    try {
      console.log(`[SPONSOR UPDATE] Syncing to exhibitors table...`)
      await prisma.$queryRawUnsafe(`
        INSERT INTO exhibitors (
          id, event_id, company_name, email, phone, contact_person,
          logo_url, website, description, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        ON CONFLICT (id)
        DO UPDATE SET
          company_name = $3,
          email = $4,
          phone = $5,
          contact_person = $6,
          logo_url = $7,
          website = $8,
          updated_at = NOW()
      `,
        sponsorId,
        eventId,
        raw.name,
        contactData.email,
        contactData.phone,
        contactData.contactPerson,
        raw.logoUrl || null,
        raw.website || null,
        raw.notes || null
      )
      console.log(`[SPONSOR UPDATE] Synced to exhibitors table`)
    } catch (exhibitorError: any) {
      console.warn(`[SPONSOR UPDATE] Failed to sync to exhibitors:`, exhibitorError.message)
    }

    console.log(`[SPONSOR UPDATE] All updates completed successfully`)
    return NextResponse.json({ success: true, id: sponsorId })

  } catch (error: any) {
    console.error('[SPONSOR UPDATE] Fatal error:', error)
    console.error('[SPONSOR UPDATE] Error stack:', error.stack)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, sponsorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)
    const sponsorId = params.sponsorId // Keep as string (CUID)

    console.log(`[SPONSOR DELETE] Deleting sponsor ${sponsorId} from event ${eventId}`)

    // Delete from sponsors table
    const result = await prisma.$queryRawUnsafe(`
      DELETE FROM sponsors
      WHERE id = $1 AND event_id = $2
      RETURNING id
    `, sponsorId, eventId) as any[]

    if (result.length === 0) {
      return NextResponse.json({ message: 'Sponsor not found' }, { status: 404 })
    }

    // Also delete from vendors table
    try {
      await prisma.$queryRawUnsafe(`DELETE FROM vendors WHERE id = $1`, sponsorId)
      console.log(`[SPONSOR DELETE] Deleted from vendors table`)
    } catch (e) {
      console.warn(`[SPONSOR DELETE] Failed to delete from vendors:`, e)
    }

    // Also delete from exhibitors table
    try {
      await prisma.$queryRawUnsafe(`DELETE FROM exhibitors WHERE id = $1`, sponsorId)
      console.log(`[SPONSOR DELETE] Deleted from exhibitors table`)
    } catch (e) {
      console.warn(`[SPONSOR DELETE] Failed to delete from exhibitors:`, e)
    }

    console.log(`[SPONSOR DELETE] Deletion completed successfully`)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    console.error('[SPONSOR DELETE] Fatal error:', e)
    return NextResponse.json({ message: e?.message || 'Delete sponsor failed' }, { status: 500 })
  }
}
