import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('paymentStatus')
    const eventId = params.id

    const where: any = { eventId }
    if (category) where.category = category
    if (paymentStatus) where.paymentStatus = paymentStatus

    const vendors = await prisma.eventVendor.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      vendors,
      total: vendors.length
    })
  } catch (error: any) {
    console.error('❌ Error fetching vendors:', error)
    return NextResponse.json({
      message: 'Failed to fetch vendors',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const eventId = params.id

  console.log(`[VENDOR POST] Creating vendor for event ${eventId}:`, body)

  try {
    // 1. Get tenant and event details
    const event = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: { tenantId: true, name: true }
    })

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const tenantId = event.tenantId || ''
    const eventName = event.name

    const {
      name, category, budget, contactName, contactEmail, contactPhone,
      contractAmount, paidAmount, paymentStatus, paymentDueDate,
      status, notes, contractUrl, invoiceUrl,
      bankName, accountNumber, ifscCode, accountHolderName, upiId
    } = body

    const newVendor = await prisma.eventVendor.create({
      data: {
        eventId,
        tenantId,
        name,
        category,
        budget: budget ? Number(budget) : 0,
        contactName,
        contactEmail,
        contactPhone,
        contractAmount: contractAmount ? Number(contractAmount) : 0,
        paidAmount: paidAmount ? Number(paidAmount) : 0,
        paymentStatus: paymentStatus || 'PENDING',
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        status: status || 'ACTIVE',
        notes,
        contractUrl,
        invoiceUrl,
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        upiId
      }
    })

    const remainingAmount = (Number(contractAmount) || 0) - (Number(paidAmount) || 0)

    // Send payment notification if needed
    if (remainingAmount > 0) {
      try {
        const admins = await prisma.user.findMany({
          where: {
            memberships: {
              some: {
                tenantId: tenantId,
                role: { in: ['OWNER', 'ADMIN'] }
              }
            }
          },
          select: { email: true, name: true }
        })

        for (const admin of admins) {
          // (Simplified fetch call to email API)
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/vendor-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: admin.email,
              adminName: admin.name,
              eventName,
              vendorName: name,
              remainingAmount,
              paymentLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/events/${eventId}/vendors/pay/${newVendor.id}`
            })
          }).catch(err => console.error('Email send failed', err))
        }
      } catch (err) {
        console.error('Email notification logic failed', err)
      }
    }

    return NextResponse.json({ message: 'Vendor created successfully', vendor: newVendor }, { status: 201 })

  } catch (error: any) {
    console.error('[VENDOR POST] Error creating vendor:', error)
    return NextResponse.json({ message: 'Failed to create vendor', error: error.message }, { status: 500 })
  }
}
