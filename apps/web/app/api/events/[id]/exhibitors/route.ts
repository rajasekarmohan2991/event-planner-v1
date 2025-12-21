
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'

// List exhibitors for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    const session = await getServerSession(authOptions) as any
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // 1. Fetch Exhibitors (Raw SQL)
    const exhibitorsRaw = await prisma.$queryRaw`
      SELECT * FROM exhibitors 
      WHERE event_id = ${eventId} 
      ORDER BY created_at DESC
    ` as any[]

    // 2. Fetch Booths
    // Assuming booths table is robust or we skip it if it fails
    // Checking if booths table exists
    let boothsRaw: any[] = []
    try {
      boothsRaw = await prisma.$queryRaw`
          SELECT * FROM booths 
          WHERE event_id = ${eventId}
        ` as any[]
    } catch {
      // Table booths might not exist
    }

    const boothsMap = new Map()
    boothsRaw.forEach((booth: any) => {
      if (booth.exhibitor_id) {
        if (!boothsMap.has(booth.exhibitor_id)) {
          boothsMap.set(booth.exhibitor_id, [])
        }
        boothsMap.get(booth.exhibitor_id).push(booth)
      }
    })

    const items = exhibitorsRaw.map(ex => {
      const exBooths = boothsMap.get(ex.id) || []
      const booth = exBooths[0]
      let status = 'PENDING'
      let payment_status = 'PENDING'

      // status mapping logic...

      return {
        id: ex.id,
        company_name: ex.company || ex.name,
        brand_name: ex.name,
        contact_name: ex.contact_name,
        contact_email: ex.contact_email,
        contact_phone: ex.contact_phone,
        booth_type: ex.booth_type,
        booth_size: ex.booth_option,
        number_of_booths: exBooths.length,
        status: status,
        payment_status: payment_status,
        total_amount: booth?.price_inr || 0,
        created_at: ex.created_at
      }
    })

    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Exhibitors fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Create exhibitor
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json().catch(() => ({}))

    if (!body.company && !body.name) {
      return NextResponse.json({
        error: 'Company name or exhibitor name is required'
      }, { status: 400 })
    }

    // 1. Fetch Tenant
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" 
      FROM events 
      WHERE id = ${BigInt(eventId)} 
      LIMIT 1
    ` as any[]

    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const tenantId = events[0].tenantId
    const newId = randomUUID()

    // 2. Insert (Raw SQL)
    // Table: exhibitors
    // We try to match known columns
    await prisma.$executeRawUnsafe(`
      INSERT INTO exhibitors (
        id, event_id, tenant_id,
        name, contact_name, contact_email, contact_phone,
        website, notes, 
        created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9,
        NOW(), NOW()
      )
    `,
      newId,
      eventId,
      tenantId,
      String(body.name || body.company || '').trim(),
      body.contactName || null,
      body.contactEmail || null,
      body.contactPhone || null,
      body.website || null,
      body.notes || null
    )

    // Fetch back to return partial obj
    const result = {
      id: newId,
      eventId: eventId,
      name: body.name || body.company,
      createdAt: new Date()
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Exhibitor creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create exhibitor' }, { status: 500 })
  }
}
