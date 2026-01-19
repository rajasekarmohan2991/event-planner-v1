import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'
export const dynamic = 'force-dynamic'

// GET /api/events/[id]/registrations
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Await params if it's a Promise (Next.js 15+)
  const params = 'then' in context.params ? await context.params : context.params

  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Tenant check? For now, list all for event.

    // Ensure schema exists (self-healing)
    try {
      const { ensureSchema } = await import('@/lib/ensure-schema')
      await ensureSchema()
    } catch (e) {
      // Ignore schema check errors, try query anyway
    }

    // Using Raw SQL for reliability
    // Registrations table has snake_case columns
    // event_id is stored as TEXT in database (from POST handler uses .toString())
    // So we must compare with string, not BigInt (Postgres strict typing: text = bigint fails)
    const registrations = await prisma.$queryRaw`
      SELECT 
        id, 
        data_json as "dataJson", 
        created_at as "createdAt", 
        status, 
        type
      FROM registrations
      WHERE event_id = ${params.id}
      ORDER BY created_at DESC
    ` as any[]

    const safeRegs = registrations.map(r => ({
      ...r,
      id: r.id,
      dataJson: typeof r.dataJson === 'string' ? JSON.parse(r.dataJson) : r.dataJson,
      createdAt: r.createdAt
    }))

    return NextResponse.json({
      registrations: safeRegs,
      pagination: {
        page: 0,
        size: safeRegs.length,
        total: safeRegs.length,
        totalPages: 1
      }
    })
  } catch (error: any) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json({ message: 'Failed to fetch registrations' }, { status: 500 })
  }
}

// POST /api/events/[id]/registrations
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Await params if it's a Promise (Next.js 15+)
  const params = 'then' in context.params ? await context.params : context.params

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
    // PHASE 2: TICKET VALIDATION (tickets table)
    // ============================================
    const ticketId = formData.ticketId || formData.ticketClassId
    const quantity = formData.quantity || 1
    let ticket: any = null

    if (ticketId) {
      console.log('🎫 Validating ticket:', ticketId)

      // Query the actual 'tickets' table (snake_case)
      // Use BigInt for ticket ID
      let ticketIdBigInt: bigint
      try {
        ticketIdBigInt = BigInt(ticketId)
      } catch (e) {
        console.log('❌ Invalid ticket ID format:', ticketId)
        return NextResponse.json({ message: 'Invalid ticket ID format' }, { status: 400 })
      }

      const tickets = await prisma.$queryRaw`
        SELECT 
          id, name, quantity as capacity, sold, status, 
          price_in_minor as "priceInMinor",
          min_purchase as "minPurchase",
          max_purchase as "maxPurchase",
          sales_start_date as "salesStartDate",
          sales_end_date as "salesEndDate",
          requires_approval as "requiresApproval"
        FROM tickets
        WHERE id = ${ticketIdBigInt}
        LIMIT 1
      ` as any[]

      console.log('🎫 Ticket query result:', tickets)

      if (tickets.length === 0) {
        console.log('❌ Invalid ticket class:', ticketId)
        return NextResponse.json({ message: 'Invalid ticket class' }, { status: 400 })
      }
      ticket = tickets[0]

      if (ticket.status !== 'ACTIVE') {
        console.log('❌ Ticket not active:', { ticketId, status: ticket.status })
        return NextResponse.json({ message: 'Ticket not available' }, { status: 400 })
      }

      // Validate min/max purchase limits
      const minPurchase = Number(ticket.minPurchase) || 1
      const maxPurchase = Number(ticket.maxPurchase) || null

      if (quantity < minPurchase) {
        console.log('❌ Below minimum purchase:', { quantity, minPurchase })
        return NextResponse.json({
          message: `Minimum purchase quantity is ${minPurchase} ticket(s)`
        }, { status: 400 })
      }

      if (maxPurchase && quantity > maxPurchase) {
        console.log('❌ Exceeds maximum purchase:', { quantity, maxPurchase })
        return NextResponse.json({
          message: `Maximum purchase quantity is ${maxPurchase} ticket(s)`
        }, { status: 400 })
      }

      // Validate sales date range
      const now = new Date()
      if (ticket.salesStartDate) {
        const salesStart = new Date(ticket.salesStartDate)
        if (now < salesStart) {
          console.log('❌ Sales not started:', { now, salesStart })
          return NextResponse.json({
            message: `Ticket sales start on ${salesStart.toLocaleDateString()}`
          }, { status: 400 })
        }
      }

      if (ticket.salesEndDate) {
        const salesEnd = new Date(ticket.salesEndDate)
        if (now > salesEnd) {
          console.log('❌ Sales ended:', { now, salesEnd })
          return NextResponse.json({
            message: `Ticket sales ended on ${salesEnd.toLocaleDateString()}`
          }, { status: 400 })
        }
      }

      // Check availability
      const sold = Number(ticket.sold) || 0
      const capacity = Number(ticket.capacity) || 0

      console.log('🎫 Ticket availability:', { sold, capacity, quantity, minPurchase, maxPurchase })

      if (capacity > 0 && (capacity - sold) < quantity) {
        return NextResponse.json({ message: 'Tickets sold out or not enough available' }, { status: 400 })
      }
    } else {
      console.log('ℹ️ No ticket ID provided, proceeding without ticket validation')
    }

    // ============================================
    // PHASE 3: CALCULATIONS (WITH OFFERS, PROMO CODES, TAX & CONVENIENCE FEES)
    // ============================================
    const basePrice = formData.totalPrice || parsed.totalPrice || 0
    let currentPrice = basePrice
    let offerDiscount = 0
    let promoDiscount = 0
    let promoCodeId: bigint | null = null

    // Step 1: Apply ticket class offers first (if applicable)
    if (ticketId) {
      const ticketIdBigInt = BigInt(ticketId)
      const now = new Date()

      const offers = await prisma.$queryRaw`
        SELECT 
          offer_type as "offerType", offer_amount as "offerAmount",
          min_quantity as "minQuantity", max_quantity as "maxQuantity",
          valid_from as "validFrom", valid_until as "validUntil",
          usage_count as "usageCount", max_usage as "maxUsage"
        FROM ticket_class_offers
        WHERE ticket_id = ${ticketIdBigInt} 
          AND event_id = ${eventIdBigInt}
          AND is_active = true
        ORDER BY offer_amount DESC
        LIMIT 1
      ` as any[]

      if (offers.length > 0) {
        const offer = offers[0]

        // Validate offer conditions
        let offerValid = true

        // Check quantity limits
        if (offer.minQuantity && quantity < Number(offer.minQuantity)) offerValid = false
        if (offer.maxQuantity && quantity > Number(offer.maxQuantity)) offerValid = false

        // Check date validity
        if (offer.validFrom && now < new Date(offer.validFrom)) offerValid = false
        if (offer.validUntil && now > new Date(offer.validUntil)) offerValid = false

        // Check usage limit
        if (offer.maxUsage && Number(offer.usageCount) >= Number(offer.maxUsage)) offerValid = false

        if (offerValid) {
          if (offer.offerType === 'PERCENTAGE') {
            offerDiscount = (currentPrice * Number(offer.offerAmount)) / 100
          } else {
            offerDiscount = Number(offer.offerAmount) * quantity
          }
          currentPrice = Math.max(0, currentPrice - offerDiscount)
          console.log('🎁 Ticket offer applied:', { offerDiscount, currentPrice })
        }
      }
    }

    // Step 2: Apply promo code discount on top of offer discount
    const promoCode = formData.promoCode
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
          promoDiscount = (currentPrice * Number(promo.amount)) / 100
        } else {
          promoDiscount = Number(promo.amount)
        }
        currentPrice = Math.max(0, currentPrice - promoDiscount)
        promoCodeId = promo.id
        console.log('🎟️ Promo code applied:', { promoDiscount, currentPrice })
      }
    }

    const totalDiscount = offerDiscount + promoDiscount
    let priceAfterDiscount = currentPrice

    // Calculate complete pricing with tax and convenience fees
    const { calculateCompletePricing } = await import('@/lib/convenience-fee-calculator')

    let pricingBreakdown
    let taxAmount = 0
    let convenienceFee = 0
    let finalAmount = priceAfterDiscount

    try {
      pricingBreakdown = await calculateCompletePricing(priceAfterDiscount, {
        tenantId,
        eventId: eventId,
        itemType: 'TICKET',
        quantity: quantity
      })

      taxAmount = pricingBreakdown.tax
      convenienceFee = pricingBreakdown.convenienceFee
      finalAmount = pricingBreakdown.total

      console.log('💰 Pricing breakdown:', {
        basePrice,
        offerDiscount,
        promoDiscount,
        totalDiscount,
        priceAfterDiscount,
        tax: taxAmount,
        convenienceFee,
        finalAmount
      })
    } catch (pricingError) {
      console.warn('⚠️ Pricing calculation failed, using base price:', pricingError)
      // Fallback to simple calculation if pricing service fails
      finalAmount = priceAfterDiscount
    }

    // ============================================
    // PHASE 4: INSERTION
    // ============================================
    const newRegId = crypto.randomUUID()
    const newOrderId = crypto.randomUUID()
    const userId = (session as any)?.user?.id ? BigInt((session as any).user.id) : null

    // Determine registration status based on approval requirement
    const requiresApproval = ticket?.requiresApproval || false
    const initialStatus = requiresApproval ? 'PENDING' : 'APPROVED'

    const registrationData = {
      ...formData,
      userId: userId ? String(userId) : null,
      registeredAt: new Date().toISOString(),
      status: 'CONFIRMED',
      totalPrice: basePrice,
      finalAmount,
      promoCode,
      offerDiscount,
      promoDiscount,
      totalDiscount,
      taxAmount,
      convenienceFee,
      requiresApproval
    }

    console.log('💾 Starting registration:', {
      regId: newRegId,
      eventId,
      email: formData.email,
      ticketId: ticketId || 'none',
      requiresApproval,
      initialStatus
    })

    // Ensure schema exists before attempting insert
    try {
      await ensureSchema()
    } catch (schemaError) {
      console.warn('⚠️ Schema check failed, continuing anyway:', schemaError)
    }

    // Use individual queries instead of transaction for better connection pool handling
    try {
      // 1. Insert Registration ('registrations')
      console.log('📝 Inserting registration into database...')
      const regType = parsed?.type || 'GENERAL'
      const regStatus = initialStatus

      const registrationDataJson = JSON.stringify(registrationData)
      const eventIdStr = eventIdBigInt.toString()
      const ticketIdStr = ticketId ? String(ticketId) : null

      await prisma.$executeRaw`
            INSERT INTO registrations (
                id, event_id, tenant_id, data_json, type, email, created_at, updated_at, status, ticket_id
            ) VALUES (
                ${newRegId}, ${eventIdStr}, ${tenantId}, ${registrationDataJson}, ${regType}, ${formData.email}, NOW(), NOW(), ${regStatus}, ${ticketIdStr}
            )
        `
      console.log('✅ Registration inserted')

      // 2. Insert Order ('"Order"')
      const orderEventId = String(eventId)
      const userIdStr = userId ? String(userId) : null
      await prisma.$executeRaw`
            INSERT INTO "Order" (
                "id", "eventId", "tenantId", "userId", "email", "status", 
                "paymentStatus", "totalInr", "meta", "createdAt", "updatedAt"
            ) VALUES (
                ${newOrderId},
                ${orderEventId},
                ${tenantId},
                ${userIdStr},
                ${formData.email},
                ${finalAmount > 0 ? 'PAID' : 'CREATED'},
                ${finalAmount > 0 ? 'COMPLETED' : 'FREE'},
                ${Math.round(finalAmount)},
                ${JSON.stringify({ registrationId: newRegId, totalDiscount, offerDiscount, promoDiscount, promoCode })},
                NOW(),
                NOW()
            )
        `

      // 3. Promo Redemption - Moved outside transaction to prevent failure if table missing

      console.log('✅ Order inserted')

      // 3. Update Ticket Sold Count (tickets table)
      if (ticketId) {
        console.log('🎫 Updating sold count for ticket:', ticketId)
        const ticketIdBigInt = BigInt(ticketId)
        await prisma.$executeRaw`
          UPDATE tickets 
          SET sold = sold + ${quantity}
          WHERE id = ${ticketIdBigInt}
        `
        console.log('✅ Ticket sold count updated')
      }

    } catch (insertError: any) {
      console.error('❌ Registration insert failed:', insertError.message)
      console.error('❌ Registration insert error stack:', insertError.stack)
      console.error('❌ Registration insert error code:', insertError.code)

      // Return user-friendly error message
      return NextResponse.json({
        error: 'Registration failed. Please try again.',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 });
    }

    // 5. Approval (registration_approvals) - Create approval record
    try {
      await prisma.$executeRaw`
            INSERT INTO registration_approvals (
                registration_id, event_id, status, created_at
            ) VALUES (
                ${newRegId}, ${eventIdBigInt}, ${initialStatus}, NOW()
            )
        `
      console.log(`✅ Registration approval record created with status: ${initialStatus}`)
    } catch (e: any) {
      console.log('⚠️ registration_approvals insert skipped:', e.message?.substring(0, 100))
    }

    // 6. Log Promo Redemption (Non-critical)
    if (promoCodeId && userId) {
      try {
        const userIdStr = String(userId)
        await prisma.$executeRaw`
            INSERT INTO promo_redemptions (
                promo_code_id, user_id, order_amount, discount_amount, redeemed_at
            ) VALUES (
                ${promoCodeId}, ${userIdStr}, ${basePrice}, ${promoDiscount}, NOW()
            )
        `
      } catch (e: any) {
        console.warn('⚠️ Failed to log promo redemption (table might be missing):', e.message)
      }
    }

    console.log('✅ Registration transaction completed successfully!')
    console.log('✅ Registration ID:', newRegId)

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

    // Send SMS notification
    if (formData.phone) {
      const smsMessage = `Registration confirmed for ${event.name}! Check-in Code: ${qrData.checkInCode}. Show this at the venue.`
      fetch('/api/notify/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.phone,
          message: smsMessage
        })
      }).catch(err => console.error('SMS send failed:', err))
    }

    // Send WhatsApp notification
    if (formData.phone) {
      const whatsappMessage = `🎉 Registration Confirmed!\n\nEvent: ${event.name}\nCheck-in Code: ${qrData.checkInCode}\n\nShow this message at the venue for quick check-in.`
      fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.phone,
          message: whatsappMessage
        })
      }).catch(err => console.error('WhatsApp send failed:', err))
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
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))

    // Ensure schema self-healing ran if it was a DB error
    if (error.message?.includes('relation') || error.message?.includes('column') || error.message?.includes('does not exist')) {
      try {
        console.log('🔧 Running schema self-healing...')
        const { ensureSchema } = await import('@/lib/ensure-schema')
        await ensureSchema()
        return NextResponse.json({
          message: 'Database schema updated. Please try again.',
          needsRetry: true
        }, { status: 503 })
      } catch (e) {
        console.error('Schema healing failed:', e)
      }
    }

    return NextResponse.json({
      message: 'Registration failed',
      error: error.message || 'Unknown error occurred',
      code: error.code,
      hint: 'Please check the console logs for details'
    }, { status: 500 })
  }
}
