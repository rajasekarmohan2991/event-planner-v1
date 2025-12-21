
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { getTenantId } from '@/lib/tenant-context'

// GET - List all vendors for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('paymentStatus')

    const eventId = params.id

    const vendorsRaw = await prisma.$queryRaw`
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
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    ` as any[]

    // Apply filters in Memory
    let vendors = vendorsRaw.map(v => ({
      ...v,
      contractAmount: Number(v.contractAmount),
      paidAmount: Number(v.paidAmount)
    }))

    if (category) {
      vendors = vendors.filter((v: any) => v.category === category)
    }
    if (paymentStatus) {
      vendors = vendors.filter((v: any) => v.paymentStatus === paymentStatus)
    }

    // Calculate totals
    const totals = vendors.reduce((acc: any, vendor: any) => ({
      contracted: acc.contracted + (vendor.contractAmount || 0),
      paid: acc.paid + (vendor.paidAmount || 0),
      pending: acc.pending + ((vendor.contractAmount || 0) - (vendor.paidAmount || 0))
    }), { contracted: 0, paid: 0, pending: 0 })

    return NextResponse.json({ vendors, totals })
  } catch (error: any) {
    console.error('Get vendors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add new vendor
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_vendors', 'Add Vendor')
  if (permError) return permError

  try {
    const body = await req.json()
    const {
      name,
      category,
      contactName,
      contactEmail,
      contactPhone,
      contractAmount,
      paymentDueDate,
      notes,
      contractUrl,
      invoiceUrl,
      status // Allow status to be set (BOOKED, ACTIVE, etc.)
    } = body
    const tenantId = getTenantId()

    if (!name || !category) {
      return NextResponse.json({
        message: 'Name and category are required'
      }, { status: 400 })
    }

    // Raw SQL Insert into event_vendors
    const result = await prisma.$queryRaw`
      INSERT INTO event_vendors (
        event_id,
        name,
        category,
        contact_name,
        contact_email,
        contact_phone,
        contract_amount,
        paid_amount,
        payment_status,
        payment_due_date,
        status,
        notes,
        contract_url,
        invoice_url,
        tenant_id,
        created_at,
        updated_at
      ) VALUES (
        ${BigInt(params.id)},
        ${name},
        ${category},
        ${contactName},
        ${contactEmail},
        ${contactPhone},
        ${contractAmount ? Number(contractAmount) : 0},
        0,
        'PENDING',
        ${paymentDueDate ? new Date(paymentDueDate) : null},
        ${status || 'BOOKED'},
        ${notes},
        ${contractUrl},
        ${invoiceUrl},
        ${tenantId},
        NOW(),
        NOW()
      )
      RETURNING id, name
    ` as any[];

    const vendor = result[0];

    return NextResponse.json({ message: 'Vendor added', vendor }, { status: 201 })
  } catch (error: any) {
    console.error('Add vendor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update vendor (payment, status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_vendors', 'Update Vendor')
  if (permError) return permError

  try {
    const body = await req.json()
    const { vendorId, paidAmount, status, notes, contractUrl, invoiceUrl } = body

    if (!vendorId) {
      return NextResponse.json({ message: 'Vendor ID required' }, { status: 400 })
    }

    // Check Current Status (Raw SQL)
    const currents = await prisma.$queryRaw`
        SELECT contract_amount, paid_amount, payment_status, payment_due_date 
        FROM event_vendors WHERE id = ${Number(vendorId)}
    ` as any[];

    if (!currents.length) {
      return NextResponse.json({ message: 'Vendor not found' }, { status: 404 })
    }
    const current = currents[0];

    const newPaidAmount = paidAmount !== undefined ? Number(paidAmount) : Number(current.paid_amount)
    const contractAmount = Number(current.contract_amount)

    // Determine payment status
    let paymentStatus = current.payment_status
    if (newPaidAmount >= contractAmount) {
      paymentStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PARTIAL'
    } else {
      paymentStatus = 'PENDING'
    }

    // Check if overdue
    if (current.payment_due_date && new Date() > new Date(current.payment_due_date) && paymentStatus !== 'PAID') {
      paymentStatus = 'OVERDUE'
    }
    // Update (Raw SQL)
    // We construct query dynamically or just COALESCE
    await prisma.$executeRawUnsafe(`
        UPDATE event_vendors
        SET 
           paid_amount = $1,
           payment_status = $2,
           status = COALESCE($3, status),
           notes = COALESCE($4, notes),
           contract_url = COALESCE($5, contract_url),
           invoice_url = COALESCE($6, invoice_url),
           updated_at = NOW()
        WHERE id = $7
    `,
      newPaidAmount,
      paymentStatus,
      status || null,
      notes || null,
      contractUrl || null,
      invoiceUrl || null,
      Number(vendorId)
    );

    return NextResponse.json({ message: 'Vendor updated' })
  } catch (error: any) {
    console.error('Update vendor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete vendor
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_vendors', 'Delete Vendor')
  if (permError) return permError

  try {
    const { searchParams } = new URL(req.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json({ message: 'Vendor ID required' }, { status: 400 })
    }

    await prisma.$executeRaw`DELETE FROM event_vendors WHERE id = ${Number(vendorId)}`

    return NextResponse.json({ message: 'Vendor deleted' })
  } catch (error: any) {
    console.error('Delete vendor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
