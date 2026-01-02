import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'

// Production schema: event_vendors has event_id (TEXT)

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

  const body = await req.json()
  const eventId = params.id

  // 1. Get tenant and event details
  let tenantId = ''
  let eventDetails: any = null
  try {
    const events = await prisma.$queryRaw`
      SELECT 
        tenant_id as "tenantId",
        name as "eventName",
        start_date as "startDate"
      FROM events 
      WHERE id = ${BigInt(eventId)} 
      LIMIT 1
    ` as any[]
    if (!events.length) return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    tenantId = events[0].tenantId
    eventDetails = events[0]
  } catch (e: any) {
    return NextResponse.json({ message: 'Event fetch failed' }, { status: 500 })
  }

  const newId = randomUUID()
  const {
    name, category, contactName, contactEmail, contactPhone,
    contractAmount, paidAmount, paymentStatus, paymentDueDate,
    status, notes, contractUrl, invoiceUrl,
    bankName, accountNumber, ifscCode, accountHolderName, upiId
  } = body

  // Helper to run insert
  const runInsert = async () => {
    await prisma.$executeRawUnsafe(`
      INSERT INTO event_vendors (
        id, event_id, tenant_id, name, category,
        contact_name, contact_email, contact_phone,
        contract_amount, paid_amount, payment_status, payment_due_date,
        status, notes, contract_url, invoice_url,
        bank_name, account_number, ifsc_code, account_holder_name, upi_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20, $21,
        NOW(), NOW()
      )
    `,
      newId, eventId, tenantId, name, category,
      contactName || null, contactEmail || null, contactPhone || null,
      contractAmount || 0, paidAmount || 0, paymentStatus || 'PENDING', paymentDueDate || null,
      status || 'ACTIVE', notes || null, contractUrl || null, invoiceUrl || null,
      bankName || null, accountNumber || null, ifscCode || null, accountHolderName || null, upiId || null
    )
  }

  try {
    await runInsert()

    // Calculate remaining amount
    const remainingAmount = (contractAmount || 0) - (paidAmount || 0)

    // Send payment notification if there's a remaining balance
    if (remainingAmount > 0) {
      try {
        // Get event admins/owners
        const admins = await prisma.$queryRaw`
          SELECT DISTINCT u.email, u.name
          FROM users u
          INNER JOIN tenant_members tm ON u.id = tm.user_id
          WHERE tm.tenant_id = ${tenantId}
          AND tm.role IN ('OWNER', 'ADMIN')
        ` as any[]

        // Send email to each admin
        for (const admin of admins) {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/vendor-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: admin.email,
              adminName: admin.name,
              eventName: eventDetails.eventName,
              vendorName: name,
              category,
              contractAmount,
              paidAmount,
              remainingAmount,
              paymentDueDate,
              bankDetails: {
                bankName,
                accountNumber,
                ifscCode,
                accountHolderName,
                upiId
              },
              vendorContact: {
                name: contactName,
                email: contactEmail,
                phone: contactPhone
              },
              paymentLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/events/${eventId}/vendors/pay/${newId}`
            })
          })
        }
      } catch (emailError) {
        console.error('Failed to send payment notification:', emailError)
        // Don't fail the vendor creation if email fails
      }
    }

    return NextResponse.json({ message: 'Vendor created successfully', vendor: { id: newId, eventId, ...body } }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vendor:', error)

    // Auto-repair and RETRY
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('🩹 Self-repairing schema for Vendor POST...')
      await ensureSchema()
      try {
        await runInsert()
        return NextResponse.json({ message: 'Vendor created successfully (after repair)', vendor: { id: newId, eventId, ...body } }, { status: 201 })
      } catch (retryError: any) {
        console.error('Retry failed:', retryError)
        return NextResponse.json({ message: 'Failed to create vendor after repair', error: retryError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Failed to create vendor', error: error.message }, { status: 500 })
  }
}
