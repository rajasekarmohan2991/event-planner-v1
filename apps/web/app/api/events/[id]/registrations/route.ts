
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import QRCode from 'qrcode'
import crypto from 'crypto'

// GET /api/events/[id]/registrations
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Tenant check? For now, list all for event.

    // Using Raw SQL for reliability
    // Registrations table has snake_case columns
    const registrations = await prisma.$queryRaw`
      SELECT 
        id, 
        data_json as "dataJson", 
        created_at as "createdAt", 
        status, 
        type
      FROM registrations
      WHERE event_id = ${BigInt(params.id)}
      ORDER BY created_at DESC
    ` as any[]

    const safeRegs = registrations.map(r => ({
      ...r,
      id: r.id,
      dataJson: r.dataJson,
      createdAt: r.createdAt
    }))

    return NextResponse.json({
      objects: safeRegs,
      count: safeRegs.length
    })
  } catch (error: any) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json({ message: 'Failed to fetch registrations' }, { status: 500 })
  }
}

// POST /api/events/[id]/registrations
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    const bodyText = await req.text()
    let parsed: any = null

    try {
      parsed = bodyText ? JSON.parse(bodyText) : null
    } catch (parseError) {
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 })
    }

    const eventId = params.id
    const eventIdBigInt = BigInt(eventId)
    const formData = parsed?.data || parsed

    console.log('📝 Registration data received:', { email: formData?.email, firstName: formData?.firstName, lastName: formData?.lastName, ticketId: formData?.ticketId })

    // Validate required fields
    if (!formData?.email || !formData?.firstName || !formData?.lastName) {
      console.log('❌ Missing required fields:', { email: !!formData?.email, firstName: !!formData?.firstName, lastName: !!formData?.lastName })
      return NextResponse.json({
        message: 'Missing required fields: email, firstName, and lastName are required'
      }, { status: 400 })
    }

    // ============================================
    // PHASE 1: EVENT LOOKUP (Raw SQL - 'events')
    // ============================================
    const events = await prisma.$queryRaw`
        SELECT id, name, starts_at as "startsAt", ends_at as "endsAt", tenant_id as "tenantId"
        FROM events
        WHERE id = ${eventIdBigInt}
        LIMIT 1
    ` as any[]

    if (events.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = events[0]
    const tenantId = event.tenantId
    const now = new Date()
    const eventEnd = event.endsAt ? new Date(event.endsAt) : null

    if (eventEnd && now > eventEnd) {
      console.log('❌ Event has ended:', { eventEnd, now })
      return NextResponse.json({ message: 'This event has ended.' }, { status: 400 })
    }

    // ============================================
    // PHASE 2: TICKET VALIDATION ('"Ticket"')
    // ============================================
    const ticketId = formData.ticketId || formData.ticketClassId
    const quantity = formData.quantity || 1
    let ticket: any = null

    if (ticketId) {
      // Ticket ID is String. Table is "Ticket".
      // Production schema: id, eventId, name, description, priceInr, currency, capacity, sold, status
      const tickets = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id, name, capacity, sold, status, "priceInr" as "priceInMinor"
            FROM "Ticket"
            WHERE id = $1
            LIMIT 1
        `, ticketId)

      if (tickets.length === 0) {
        console.log('❌ Invalid ticket class:', ticketId)
        return NextResponse.json({ message: 'Invalid ticket class' }, { status: 400 })
      }
      ticket = tickets[0]

      if (ticket.status !== 'ACTIVE') {
        console.log('❌ Ticket not active:', { ticketId, status: ticket.status })
        return NextResponse.json({ message: 'Ticket not available' }, { status: 400 })
      }

      const sold = ticket.sold || 0
      const capacity = ticket.capacity || 0

      if (capacity > 0 && (capacity - sold) < quantity) {
        return NextResponse.json({ message: 'Tickets sold out or asking too many' }, { status: 400 })
      }
    }

    // ============================================
    // PHASE 3: CALCULAIONS
    // ============================================
    const totalPrice = formData.totalPrice || parsed.totalPrice || 0
    const promoCode = formData.promoCode
    let finalAmount = totalPrice
    let discountAmount = 0
    let promoCodeId: bigint | null = null

    if (promoCode) {
      const promos = await prisma.$queryRaw`
            SELECT id, discount_type as type, discount_amount as amount
            FROM promo_codes
            WHERE code = ${promoCode} AND event_id = ${eventIdBigInt} AND is_active = true
            LIMIT 1
        ` as any[]

      if (promos.length > 0) {
        const promo = promos[0]
        if (promo.type === 'PERCENT' || promo.type === 'PERCENTAGE') {
          discountAmount = (totalPrice * Number(promo.amount)) / 100
        } else {
          discountAmount = Number(promo.amount)
        }
        finalAmount = Math.max(0, totalPrice - discountAmount)
        promoCodeId = promo.id
      }
    }

    // ============================================
    // PHASE 4: INSERTION
    // ============================================
    const newRegId = crypto.randomUUID()
    const newOrderId = crypto.randomUUID()
    const userId = (session as any)?.user?.id ? BigInt((session as any).user.id) : null

    const registrationData = {
      ...formData,
      userId: userId ? String(userId) : null,
      registeredAt: new Date().toISOString(),
      status: 'CONFIRMED',
      totalPrice,
      finalAmount,
      promoCode
    }

    await prisma.$transaction(async (tx) => {
      // 1. Insert Registration ('registrations')
      // Ensure ticket_id is set
      await tx.$executeRaw`
            INSERT INTO registrations (
                id, event_id, tenant_id, data_json, type, email, created_at, status, ticket_id
            ) VALUES (
                ${newRegId},
                ${eventIdBigInt},
                ${tenantId},
                ${JSON.stringify(registrationData)}::jsonb,
                ${parsed?.type || 'VIRTUAL'},
                ${formData.email},
                NOW(),
                'APPROVED',
                ${ticketId || null}
            )
        `

      // 2. Insert Order ('"Order"')
      // Columns: "eventId", "tenantId", "paymentStatus"
      await tx.$executeRaw`
            INSERT INTO "Order" (
                id, "eventId", "tenantId", "userId", email, status, 
                "paymentStatus", "totalInr", meta, created_at, updated_at
            ) VALUES (
                ${newOrderId},
                ${eventId},   -- String
                ${tenantId},  -- String
                ${userId},
                ${formData.email},
                ${finalAmount > 0 ? 'PAID' : 'CREATED'},
                ${finalAmount > 0 ? 'COMPLETED' : 'FREE'},
                ${Math.round(finalAmount)},
                ${JSON.stringify({ registrationId: newRegId, discountAmount, promoCode })}::jsonb,
                NOW(),
                NOW()
            )
        `

      // 3. Promo Redemption
      if (promoCodeId && userId) {
        await tx.$executeRaw`
                INSERT INTO promo_redemptions (
                    promo_code_id, user_id, order_amount, discount_amount, redeemed_at
                ) VALUES (
                    ${BigInt(promoCodeId)}, ${userId}, ${totalPrice}, ${discountAmount}, NOW()
                )
             `
      }

      // 4. Update Ticket Sold Count ('"Ticket"')
      if (ticketId) {
        // ticketId is String. ticket.sold is Int.
        await tx.$executeRawUnsafe(`
            UPDATE "Ticket" 
            SET sold = sold + $1 
            WHERE id = $2
        `, quantity, ticketId)
      }

      // 5. Approval (registration_approvals) - OPTIONAL
      try {
        await tx.$executeRaw`
              INSERT INTO registration_approvals (
                  registration_id, event_id, status, created_at
              ) VALUES (
                  ${newRegId}, ${eventIdBigInt}, 'APPROVED', NOW()
              )
          `
      } catch (e: any) {
        console.log('⚠️ registration_approvals not found, skipping')
      }
    })

    // ============================================
    // PHASE 5: QR Code & Response
    // ============================================
    const qrData = {
      type: 'EVENT_REGISTRATION',
      registrationId: newRegId,
      eventId: eventId,
      checkInCode: `REG-${eventId}-${newRegId.substring(0, 8)}`
    }

    let qrCodeDataURL = ''
    try {
      qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData))
    } catch (e) {
      console.error('QR Gen failed', e)
    }

    // Async Email
    if (formData.email && qrCodeDataURL) {
      sendEmail({
        to: formData.email,
        subject: `Registration Confirmed - ${event.name}`,
        text: `Confirmed! Check-in Code: ${qrData.checkInCode}`,
        html: `<p>Registration Confirmed for <strong>${event.name}</strong></p><img src="${qrCodeDataURL}" />`
      }).catch(console.error)
    }

    return NextResponse.json({
      id: newRegId,
      eventId: Number(eventId),
      dataJson: registrationData,
      checkInCode: qrData.checkInCode,
      qrCode: qrCodeDataURL,
      message: 'Registration successful'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating registration:', error)
    return NextResponse.json({
      message: 'Registration failed',
      error: error.message
    }, { status: 500 })
  }
}
