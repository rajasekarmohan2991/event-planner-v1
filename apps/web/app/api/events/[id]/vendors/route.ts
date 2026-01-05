import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'
export const dynamic = 'force-dynamic'

// Production schema: event_vendors has event_id (TEXT)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('paymentStatus')

    const eventId = params.id

    // First ensure the table exists
    await ensureSchema()

    // Use parameterized query for safety
    let vendorsRaw: any[] = []
    
    if (category && paymentStatus) {
      vendorsRaw = await prisma.$queryRawUnsafe(`
        SELECT 
          id, event_id as "eventId", name, category, budget,
          contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
          contract_amount as "contractAmount", paid_amount as "paidAmount",
          payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
          status, notes, contract_url as "contractUrl", invoice_url as "invoiceUrl",
          created_at as "createdAt", updated_at as "updatedAt", tenant_id as "tenantId"
        FROM event_vendors
        WHERE event_id = $1 AND category = $2 AND payment_status = $3
        ORDER BY created_at DESC
      `, eventId, category, paymentStatus)
    } else if (category) {
      vendorsRaw = await prisma.$queryRawUnsafe(`
        SELECT 
          id, event_id as "eventId", name, category, budget,
          contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
          contract_amount as "contractAmount", paid_amount as "paidAmount",
          payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
          status, notes, contract_url as "contractUrl", invoice_url as "invoiceUrl",
          created_at as "createdAt", updated_at as "updatedAt", tenant_id as "tenantId"
        FROM event_vendors
        WHERE event_id = $1 AND category = $2
        ORDER BY created_at DESC
      `, eventId, category)
    } else if (paymentStatus) {
      vendorsRaw = await prisma.$queryRawUnsafe(`
        SELECT 
          id, event_id as "eventId", name, category, budget,
          contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
          contract_amount as "contractAmount", paid_amount as "paidAmount",
          payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
          status, notes, contract_url as "contractUrl", invoice_url as "invoiceUrl",
          created_at as "createdAt", updated_at as "updatedAt", tenant_id as "tenantId"
        FROM event_vendors
        WHERE event_id = $1 AND payment_status = $2
        ORDER BY created_at DESC
      `, eventId, paymentStatus)
    } else {
      vendorsRaw = await prisma.$queryRawUnsafe(`
        SELECT 
          id, event_id as "eventId", name, category, budget,
          contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
          contract_amount as "contractAmount", paid_amount as "paidAmount",
          payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
          status, notes, contract_url as "contractUrl", invoice_url as "invoiceUrl",
          created_at as "createdAt", updated_at as "updatedAt", tenant_id as "tenantId"
        FROM event_vendors
        WHERE event_id = $1
        ORDER BY created_at DESC
      `, eventId)
    }

    return NextResponse.json({
      vendors: vendorsRaw,
      total: vendorsRaw.length
    })
  } catch (error: any) {
    console.error('❌ Error fetching vendors:', error)
    console.error('❌ Error message:', error.message)
    
    // Attempt self-repair for any error
    try {
      console.log('🔧 Running schema self-healing for vendors...')
      await ensureSchema()
      
      // Retry the query after repair
      const eventId = params.id
      const vendorsRaw = await prisma.$queryRawUnsafe(`
        SELECT 
          id, event_id as "eventId", name, category, budget,
          contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
          contract_amount as "contractAmount", paid_amount as "paidAmount",
          payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
          status, notes, contract_url as "contractUrl", invoice_url as "invoiceUrl",
          created_at as "createdAt", updated_at as "updatedAt", tenant_id as "tenantId"
        FROM event_vendors
        WHERE event_id = $1
        ORDER BY created_at DESC
      `, eventId) as any[]
      
      return NextResponse.json({
        vendors: vendorsRaw,
        total: vendorsRaw.length
      })
    } catch (retryError: any) {
      console.error('❌ Retry also failed:', retryError.message)
      return NextResponse.json({ 
        message: 'Failed to fetch vendors', 
        error: retryError.message || 'Unknown error'
      }, { status: 500 })
    }
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const eventId = params.id

  console.log(`[VENDOR POST] Creating vendor for event ${eventId}:`, body)

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
    if (!events.length) {
      console.error(`[VENDOR POST] Event ${eventId} not found`)
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }
    tenantId = events[0].tenantId
    eventDetails = events[0]
    console.log(`[VENDOR POST] Event found, tenantId: ${tenantId}`)
  } catch (e: any) {
    console.error(`[VENDOR POST] Event fetch failed:`, e)
    return NextResponse.json({ message: 'Event fetch failed', error: e.message }, { status: 500 })
  }

  const newId = randomUUID()
  const {
    name, category, budget, contactName, contactEmail, contactPhone,
    contractAmount, paidAmount, paymentStatus, paymentDueDate,
    status, notes, contractUrl, invoiceUrl,
    bankName, accountNumber, ifscCode, accountHolderName, upiId
  } = body

  // Helper to run insert
  const runInsert = async () => {
    await prisma.$executeRawUnsafe(`
      INSERT INTO event_vendors (
        id, event_id, tenant_id, name, category, budget,
        contact_name, contact_email, contact_phone,
        contract_amount, paid_amount, payment_status, payment_due_date,
        status, notes, contract_url, invoice_url,
        bank_name, account_number, ifsc_code, account_holder_name, upi_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21, $22,
        NOW(), NOW()
      )
    `,
      newId, eventId, tenantId, name, category, budget || 0,
      contactName || null, contactEmail || null, contactPhone || null,
      contractAmount || 0, paidAmount || 0, paymentStatus || 'PENDING', paymentDueDate || null,
      status || 'ACTIVE', notes || null, contractUrl || null, invoiceUrl || null,
      bankName || null, accountNumber || null, ifscCode || null, accountHolderName || null, upiId || null
    )
  }

  try {
    console.log(`[VENDOR POST] Inserting vendor with ID: ${newId}`)
    await runInsert()
    console.log(`[VENDOR POST] Vendor inserted successfully`)

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
    console.error('[VENDOR POST] Error creating vendor:', error)
    console.error('[VENDOR POST] Error message:', error.message)
    console.error('[VENDOR POST] Error stack:', error.stack)
    console.error('[VENDOR POST] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))

    // Auto-repair and RETRY
    if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('column')) {
      console.log('[VENDOR POST] 🩹 Self-repairing schema for Vendor POST...')
      await ensureSchema()
      try {
        console.log('[VENDOR POST] Retrying insert after schema repair...')
        await runInsert()
        console.log('[VENDOR POST] Retry successful')
        return NextResponse.json({ message: 'Vendor created successfully (after repair)', vendor: { id: newId, eventId, ...body } }, { status: 201 })
      } catch (retryError: any) {
        console.error('[VENDOR POST] Retry failed:', retryError)
        console.error('[VENDOR POST] Retry error details:', JSON.stringify(retryError, Object.getOwnPropertyNames(retryError)))
        return NextResponse.json({ message: 'Failed to create vendor after repair', error: retryError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Failed to create vendor', error: error.message, hint: 'Check server logs for details' }, { status: 500 })
  }
}
