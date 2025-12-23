import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'

// ...

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('paymentStatus')

    const eventId = params.id

    // Build WHERE clause
    let whereClause = `WHERE event_id = '${eventId}'`
    if (category) whereClause += ` AND category = '${category}'`
    if (paymentStatus) whereClause += ` AND payment_status = '${paymentStatus}'`

    const vendorsRaw = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        event_id as "eventId",
        name,
        category,
        contact_name as "contactName",
        contact_email as "contactEmail",
        contact_phone as "contactPhone",
        contract_amount as "contractAmount",
        paid_amount as "paidAmount",
        payment_status as "paymentStatus",
        payment_due_date as "paymentDueDate",
        status,
        notes,
        contract_url as "contractUrl",
        invoice_url as "invoiceUrl",
        created_at as "createdAt",
        updated_at as "updatedAt",
        tenant_id as "tenantId"
      FROM event_vendors
      ${whereClause}
      ORDER BY created_at DESC
    `) as any[]

    return NextResponse.json({
      vendors: vendorsRaw,
      total: vendorsRaw.length
    })
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    // Attempt self-repair
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      await ensureSchema()
      return NextResponse.json({ message: 'Database schema repaired. Please retry.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to fetch vendors', error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const eventId = params.id

    // Get tenant from event
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" FROM events WHERE id = ${BigInt(eventId)} LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const tenantId = events[0].tenantId
    const newId = randomUUID()

    const {
      name,
      category,
      contactName,
      contactEmail,
      contactPhone,
      contractAmount,
      paidAmount,
      paymentStatus,
      paymentDueDate,
      status,
      notes,
      contractUrl,
      invoiceUrl
    } = body

    await prisma.$executeRawUnsafe(`
      INSERT INTO event_vendors (
        id, event_id, tenant_id, name, category,
        contact_name, contact_email, contact_phone,
        contract_amount, paid_amount, payment_status, payment_due_date,
        status, notes, contract_url, invoice_url,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        NOW(), NOW()
      )
    `,
      newId,
      eventId,
      tenantId,
      name,
      category,
      contactName || null,
      contactEmail || null,
      contactPhone || null,
      contractAmount || 0,
      paidAmount || 0,
      paymentStatus || 'PENDING',
      paymentDueDate || null,
      status || 'ACTIVE',
      notes || null,
      contractUrl || null,
      invoiceUrl || null
    )

    return NextResponse.json({
      message: 'Vendor created successfully',
      vendor: { id: newId, eventId, ...body }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating vendor:', error)
    return NextResponse.json({ message: 'Failed to create vendor', error: error.message }, { status: 500 })
  }
}
