import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSMS, buildShareLink } from '@/lib/messaging'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activity'
import { getTenantId } from '@/lib/tenant-context'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/events/[id]/registrations - return list and set X-Total-Count
// Updated to remove tenant_id dependency
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '1000') // Default to show all
    const offset = page * size

    console.log(`📋 Fetching registrations for event ${eventId}, type: ${type}, status: ${status}`)

    // Build safe parameterized query
    let whereConditions = ['event_id = $1']
    let queryParams: any[] = [eventId]
    let paramIndex = 2

    if (type) {
      whereConditions.push(`type = $${paramIndex}`)
      queryParams.push(type)
      paramIndex++
    }
    if (status) {
      whereConditions.push(`(data_json::jsonb->>'status') = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Use safe parameterized queries
    const [items, totalResult] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT 
          id::text as id,
          event_id as "eventId",
          data_json as "dataJson",
          type,
          created_at as "createdAt",
          check_in_status as "checkInStatusDb",
          check_in_time as "checkInTimeDb"
        FROM registrations 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${size} OFFSET ${offset}
      `, ...queryParams),
      prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count 
        FROM registrations 
        WHERE ${whereClause}
      `, ...queryParams)
    ])

    // Enhance registration data with computed fields (parse TEXT data_json)
    const enhancedItems = (items as any[]).map(item => {
      let dataJson: any = {}
      try {
        dataJson = item.dataJson ? (typeof item.dataJson === 'string' ? JSON.parse(item.dataJson) : item.dataJson) : {}
      } catch (e) {
        console.error('Failed to parse data_json for registration:', item.id, e)
      }
      return {
        id: item.id, // Already converted to text in SQL
        eventId: Number(item.eventId), // Convert BigInt to Number
        dataJson: dataJson,
        type: item.type,
        createdAt: item.createdAt,
        // Extract key fields from JSON for easier access
        firstName: dataJson.firstName || '',
        lastName: dataJson.lastName || '',
        email: dataJson.email || item.email || '',
        phone: dataJson.phone || '',
        company: dataJson.company || '',
        jobTitle: dataJson.jobTitle || '',
        status: dataJson.status || 'PENDING',
        approvedAt: dataJson.approvedAt || null,
        approvedBy: dataJson.approvedBy || null,
        cancelledAt: dataJson.cancelledAt || null,
        cancelReason: dataJson.cancelReason || null,
        checkedIn: dataJson.checkedIn || item.checkInStatusDb === 'CHECKED_IN',
        checkInStatus: item.checkInStatusDb || (dataJson.checkedIn ? 'CHECKED_IN' : 'PENDING'),
        attendeeName: `${(dataJson.firstName || '').trim()} ${(dataJson.lastName || '').trim()}`.trim(),
        checkedInAt: dataJson.checkedInAt || null,
        sessionPreferences: dataJson.sessionPreferences || [],
        registeredAt: dataJson.registeredAt || item.createdAt
      }
    })

    const total = (totalResult as any)[0]?.count || 0

    console.log(`✅ Found ${enhancedItems.length} registrations (${total} total)`)

    const res = NextResponse.json({
      registrations: enhancedItems,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    })
    res.headers.set('X-Total-Count', String(total))
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  } catch (e: any) {
    console.error('Error fetching registrations:', e)
    return NextResponse.json({ message: e?.message || 'Fetch failed' }, { status: 500 })
  }
}

// POST /api/events/[id]/registrations - create a new registration row
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    const tenantId = getTenantId()
    const bodyText = await req.text()
    let parsed: any = null

    try {
      parsed = bodyText ? JSON.parse(bodyText) : null
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 })
    }

    const eventId = BigInt(params.id)

    // Build registration data JSON from form data
    const formData = parsed?.data || parsed

    console.log('📥 Registration API received:', {
      eventId: params.id,
      hasSession: !!session,
      parsedKeys: Object.keys(parsed || {}),
      formDataKeys: Object.keys(formData || {}),
      email: formData?.email,
      firstName: formData?.firstName,
      lastName: formData?.lastName
    })

    // Validate required fields
    if (!formData?.email || !formData?.firstName || !formData?.lastName) {
      console.error('❌ Missing required fields:', {
        hasEmail: !!formData?.email,
        hasFirstName: !!formData?.firstName,
        hasLastName: !!formData?.lastName,
        receivedFields: Object.keys(formData || {})
      })
      return NextResponse.json({
        message: 'Missing required fields: email, firstName, and lastName are required',
        received: Object.keys(formData || {})
      }, { status: 400 })
    }

    // ============================================
    // PHASE 3: EVENT TIMING VALIDATION
    // ============================================

    // Fetch event to validate timing
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({
        message: 'Event not found'
      }, { status: 404 })
    }

    const now = new Date()
    const eventStart = new Date(event.startsAt || event.startDate)
    const eventEnd = new Date(event.endsAt || event.endDate)

    // 1. Check if event has ended
    if (now > eventEnd) {
      return NextResponse.json({
        message: 'This event has ended. Registration is closed.',
        details: {
          eventEnded: eventEnd.toLocaleString(),
          currentTime: now.toLocaleString()
        }
      }, { status: 400 })
    }

    // 2. Check if event has already started
    if (now > eventStart) {
      return NextResponse.json({
        message: 'This event has already started. Registration is closed.',
        details: {
          eventStarted: eventStart.toLocaleString(),
          currentTime: now.toLocaleString()
        }
      }, { status: 400 })
    }

    console.log('✅ Event timing validation passed:', {
      eventId: params.id,
      eventName: event.name,
      startsAt: eventStart.toISOString(),
      endsAt: eventEnd.toISOString()
    })

    // ============================================
    // PHASE 2: TICKET CLASS VALIDATION (SELLING POINT!)
    // ============================================

    const ticketId = formData.ticketId || formData.ticketClassId
    const quantity = formData.quantity || 1

    if (ticketId) {
      console.log('🎫 Validating ticket class:', ticketId)

      // 1. Fetch ticket class
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      })

      if (!ticket) {
        return NextResponse.json({
          message: 'Invalid ticket class selected'
        }, { status: 400 })
      }

      // 2. Check if ticket is active
      if (ticket.status !== 'ACTIVE') {
        return NextResponse.json({
          message: 'This ticket class is not available'
        }, { status: 400 })
      }

      // 3. CAPACITY CHECK (SELLING POINT!)
      const available = ticket.capacity - ticket.sold
      if (available <= 0) {
        return NextResponse.json({
          message: `Sorry, "${ticket.name}" tickets are sold out`
        }, { status: 400 })
      }

      if (quantity > available) {
        return NextResponse.json({
          message: `Only ${available} tickets available for "${ticket.name}"`
        }, { status: 400 })
      }

      // 4. QUANTITY LIMITS (SELLING POINT!)
      if (ticket.minQuantity && quantity < ticket.minQuantity) {
        return NextResponse.json({
          message: `Minimum ${ticket.minQuantity} tickets required for "${ticket.name}"`
        }, { status: 400 })
      }

      if (ticket.maxQuantity && quantity > ticket.maxQuantity) {
        return NextResponse.json({
          message: `Maximum ${ticket.maxQuantity} tickets allowed for "${ticket.name}"`
        }, { status: 400 })
      }

      // 5. SALES PERIOD (SELLING POINT!)
      const now = new Date()

      if (ticket.salesStartAt && now < ticket.salesStartAt) {
        return NextResponse.json({
          message: `Ticket sales for "${ticket.name}" start on ${ticket.salesStartAt.toLocaleString()}`
        }, { status: 400 })
      }

      if (ticket.salesEndAt && now > ticket.salesEndAt) {
        return NextResponse.json({
          message: `Ticket sales for "${ticket.name}" ended on ${ticket.salesEndAt.toLocaleString()}`
        }, { status: 400 })
      }

      // 6. USER TYPE RESTRICTIONS (SELLING POINT!)
      if (ticket.allowedUserTypes) {
        const allowedTypes = ticket.allowedUserTypes.split(',').map(t => t.trim())
        const userType = (session as any)?.user?.userType || 'GENERAL'

        if (!allowedTypes.includes(userType)) {
          return NextResponse.json({
            message: `"${ticket.name}" is only available for: ${allowedTypes.join(', ')}`
          }, { status: 400 })
        }
      }

      console.log('✅ Ticket validation passed:', {
        ticket: ticket.name,
        quantity,
        available,
        price: ticket.priceInr
      })
    }

    // Extract payment and promo code info
    const totalPrice = formData.totalPrice || formData.priceInr || parsed.priceInr || parsed.totalPrice || 0
    const promoCode = formData.promoCode || parsed.promoCode || null
    const paymentMethod = formData.paymentMethod || 'CARD'
    const selectedSeats = formData.selectedSeats || []

    // Calculate final amount (will be adjusted if promo code is valid)
    let finalAmount = totalPrice
    let discountAmount = 0
    let promoCodeId: bigint | null = null

    // Validate and apply promo code if provided
    if (promoCode) {
      try {
        const promo = await prisma.promoCode.findFirst({
          where: {
            code: promoCode,
            eventId: BigInt(params.id), // eventId matches scopeRef concept
            isActive: true
          }
        })

        if (promo) {
          const now = new Date()

          // ============================================
          // PHASE 4: PROMO CODE 30-MIN EXPIRY RULE
          // ============================================

          // Calculate promo expiry time (30 minutes before event start)
          const promoExpiryTime = new Date(eventStart.getTime() - 30 * 60 * 1000)

          // Check if promo code has expired (30 mins before event)
          if (now > promoExpiryTime) {
            return NextResponse.json({
              message: 'Promo code expired (codes expire 30 minutes before event start)',
              details: {
                expiryTime: promoExpiryTime.toLocaleString(),
                eventStartTime: eventStart.toLocaleString(),
                currentTime: now.toLocaleString()
              }
            }, { status: 400 })
          }

          console.log('✅ Promo code timing validation passed:', {
            promoCode: promo.code,
            expiryTime: promoExpiryTime.toISOString(),
            eventStart: eventStart.toISOString(),
            timeRemaining: `${Math.round((promoExpiryTime.getTime() - now.getTime()) / (1000 * 60))} minutes`
          })

          // Validate promo code dates
          if (promo.startsAt && promo.startsAt > now) {
            return NextResponse.json({ message: 'Promo code not yet active' }, { status: 400 })
          }
          if (promo.endsAt && promo.endsAt < now) {
            return NextResponse.json({ message: 'Promo code has expired' }, { status: 400 })
          }
          if (promo.minOrderAmount && totalPrice < Number(promo.minOrderAmount)) {
            return NextResponse.json({
              message: `Minimum order amount of ${promo.minOrderAmount} required for this promo code`
            }, { status: 400 })
          }

          // Check usage limits
          const usageCountResult = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*)::int as count
            FROM promo_redemptions
            WHERE promo_code_id = ${BigInt(promo.id)}
          `
          const usageCount = usageCountResult[0]?.count || 0


          if (promo.maxRedemptions && usageCount >= promo.maxRedemptions) {
            return NextResponse.json({ message: 'Promo code usage limit reached' }, { status: 400 })
          }

          // Calculate discount
          if (promo.type === 'PERCENTAGE') {
            discountAmount = (totalPrice * Number(promo.amount)) / 100
          } else if (promo.type === 'FIXED') {
            discountAmount = Number(promo.amount)
          }

          finalAmount = Math.max(0, totalPrice - discountAmount)
          promoCodeId = promo.id
        }
      } catch (promoError) {
        console.error('Promo code validation error:', promoError)
        // Continue without promo code if validation fails
      }
    }

    const userId = (session as any)?.user?.id ? BigInt((session as any).user.id) : null

    const registrationData = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || '',
      jobTitle: formData.jobTitle || '',
      company: formData.company || '',
      sessionPreferences: formData.sessionPreferences || [],
      type: parsed?.type || 'VIRTUAL',
      userId: userId ? String(userId) : null,
      registeredAt: new Date().toISOString(),
      status: 'CONFIRMED',
      approvedAt: null,
      approvedBy: null,
      cancelledAt: null,
      cancelReason: null,
      checkedIn: false,
      checkedInAt: null,
      totalPrice: totalPrice,
      finalAmount: finalAmount,
      discountAmount: discountAmount,
      promoCode: promoCode,
      paymentMethod: paymentMethod,
      selectedSeats: selectedSeats
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Registration
      const registration = await tx.registration.create({
        data: {
          eventId: eventId,
          dataJson: registrationData, // Prisma handles JSON conversion
          type: parsed?.type || 'VIRTUAL',
          email: registrationData.email,
          createdAt: new Date(),
          status: 'APPROVED' // Directly set status
        }
      })

      const regIdStr = registration.id // UUID string

      // 2. Create Payment Record (Using Order model which replaces Payment)
      const amountInMinor = Math.round(finalAmount * 100)

      // Check if Order model exists, otherwise use raw SQL for payments table
      // verifiable via schema: Order model exists.
      await tx.order.create({
        data: {
          eventId: String(eventId),
          userId: userId,
          email: registrationData.email,
          status: finalAmount > 0 ? 'PAID' : 'CREATED',
          paymentStatus: finalAmount > 0 ? 'COMPLETED' : 'FREE',
          totalInr: finalAmount,
          meta: {
            registrationId: regIdStr,
            originalAmount: totalPrice,
            discountAmount: discountAmount,
            promoCode: promoCode,
            paymentMethod: paymentMethod
          },
          createdAt: new Date()
        }
      })

      // Also insert into legacy payments table if needed by other apps, or just skip if Order is the new standard. 
      // The original code used 'payments'. I'll stick to 'payments' via raw SQL to ensure backward compatibility if 'Answer' code expects it, 
      // BUT 'Order' is the prisma model.
      // safest bet: use raw SQL for 'payments' to match previous logic exactly, as 'Order' layout might be different.

      // Legacy payments table insert removed - using Order model instead
      // The payments table doesn't have the correct schema (missing registration_id column)

      // 3. Create Promo Redemption (Raw SQL as model missing)
      if (promoCodeId && userId) {
        await tx.$executeRaw`
          INSERT INTO promo_redemptions (
            promo_code_id,
            user_id,
            order_amount,
            discount_amount,
            redeemed_at
          ) VALUES (
            ${BigInt(promoCodeId)},
            ${userId},
            ${totalPrice},
            ${discountAmount},
            NOW()
          )
        `
      }

      // 4. Create Approval Record (Raw SQL as model missing)
      await tx.$executeRaw`
        INSERT INTO registration_approvals (
          registration_id,
          event_id,
          status,
          created_at
        ) VALUES (
          ${regIdStr},
          ${eventId},
          'APPROVED',
          NOW()
        )
      `

      return registration
    })

    const registration = result

    // ============================================
    // PHASE 5: QR CODE GENERATION
    // ============================================

    // Generate QR code for check-in
    const qrData = {
      type: 'EVENT_REGISTRATION',
      registrationId: String(registration.id),
      eventId: params.id,
      email: registrationData.email,
      name: `${registrationData.firstName} ${registrationData.lastName}`.trim(),
      ticketType: registrationData.type,
      checkInCode: `REG-${params.id}-${registration.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      timestamp: new Date().toISOString()
    }

    // Generate QR code as data URL (base64 image)
    let qrCodeDataURL = ''
    try {
      qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      console.log('✅ QR code generated successfully')
    } catch (qrError) {
      console.error('❌ QR code generation failed:', qrError)
      // Continue without QR code if generation fails
    }

    // Add QR code data to response
    const response = {
      id: String(registration.id),
      eventId: Number(registration.eventId),
      dataJson: registrationData,
      type: registration.type,
      createdAt: registration.createdAt,
      qrCode: qrCodeDataURL, // Actual QR code image (data URL)
      qrCodeData: JSON.stringify(qrData), // Raw data for verification
      checkInCode: qrData.checkInCode,
      checkInUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${params.id}/checkin?code=${qrData.checkInCode}`
    }

    // Fetch event name for activity logging
    const eventForLogging = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true }
    })
    const eventName = eventForLogging?.name || `Event #${params.id}`

    // Log registration activity
    logActivity({
      userId: userId ? Number(userId) : undefined,
      userName: `${registrationData.firstName} ${registrationData.lastName}`,
      userEmail: registrationData.email,
      action: ActivityActions.REGISTRATION_CREATED,
      entityType: EntityTypes.REGISTRATION,
      entityId: String(registration.id),
      entityName: `${registrationData.firstName} ${registrationData.lastName}`,
      description: `Registration successful for "${eventName}"`,
      metadata: {
        eventId: params.id,
        eventName,
        type: registrationData.type,
        amount: finalAmount,
        promoCode: promoCode || undefined
      }
    }).catch(err => console.error('Failed to log registration activity:', err))


    // Send confirmation email with QR code (async, don't wait)
    if (registrationData.email && qrCodeDataURL) {
      sendEmail({
        to: registrationData.email,
        subject: `Event Registration Confirmed - ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket { background: white; border: 2px dashed #2d2d2d; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .qr-code { margin: 20px 0; }
              .qr-code img { max-width: 300px; height: auto; border: 3px solid #2d2d2d; border-radius: 10px; }
              .check-in-code { background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 10px 0; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2d2d2d; }
              .button { display: inline-block; padding: 12px 30px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Registration Confirmed!</h1>
                <p>Your ticket for ${eventName} is ready</p>
              </div>
              <div class="content">
                <p>Hi <strong>${registrationData.firstName}</strong>,</p>
                <p>Thank you for registering! Your event ticket has been generated.</p>
                
                <div class="ticket">
                  <h2>Your Event Ticket</h2>
                  <div class="info">
                    <strong>Event:</strong> ${eventName}<br>
                    <strong>Registration ID:</strong> ${String(registration.id)}<br>
                    <strong>Name:</strong> ${registrationData.firstName} ${registrationData.lastName}<br>
                    <strong>Email:</strong> ${registrationData.email}<br>
                    <strong>Type:</strong> ${registrationData.type}
                  </div>
                  
                  <div class="qr-code">
                    <p><strong>Your QR Code Ticket:</strong></p>
                    <img src="${qrCodeDataURL}" alt="QR Code Ticket" />
                    <p style="font-size: 12px; color: #666;">Show this QR code at the event entrance</p>
                  </div>
                  
                  <div class="check-in-code">
                    Check-in Code: ${qrData.checkInCode}
                  </div>
                  
                  <a href="${response.checkInUrl}" class="button">View Ticket Online</a>
                </div>
                
                <div class="info">
                  <strong>📱 Important:</strong> Save this email or take a screenshot of the QR code. You'll need it to check in at the event.
                </div>
                
                <p>We look forward to seeing you at the event!</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                  <p>If you have any questions, please contact the event organizer.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Registration Confirmed!

Hi ${registrationData.firstName},

Your registration for the event has been confirmed.

Registration Details:
- Registration ID: ${String(registration.id)}
- Name: ${registrationData.firstName} ${registrationData.lastName}
- Email: ${registrationData.email}
- Type: ${registrationData.type}

Your ticket QR code is attached. Please show this at the event entrance.

View your ticket online: ${response.checkInUrl}

We look forward to seeing you at the event!

EventPlanner © 2025
        `
      }).catch(err => console.error('Email send failed:', err))
    }

    // Return the created registration with QR code
    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating registration:', error)
    console.error('❌ Error name:', error?.name)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error code:', error?.code)
    console.error('❌ Error stack:', error?.stack)

    // More specific error messages
    let errorMessage = 'Registration failed'
    let errorDetails: any = {}

    if (error?.code === 'P2002') {
      errorMessage = 'Duplicate registration detected'
      errorDetails = { field: error?.meta?.target }
    } else if (error?.code === 'P2003') {
      errorMessage = 'Invalid reference - event or user not found'
      errorDetails = { field: error?.meta?.field_name }
    } else if (error?.code === 'P2025') {
      errorMessage = 'Record not found'
    } else if (error?.message?.includes('payments')) {
      errorMessage = 'Payment record creation failed'
      errorDetails = { hint: 'Check if payments table exists' }
    } else if (error?.message?.includes('registration_approvals')) {
      errorMessage = 'Approval record creation failed'
      errorDetails = { hint: 'Check if registration_approvals table exists' }
    } else if (error?.message?.includes('promo_redemptions')) {
      errorMessage = 'Promo redemption record creation failed'
      errorDetails = { hint: 'Check if promo_redemptions table exists' }
    }

    return NextResponse.json({
      message: errorMessage,
      details: errorDetails,
      originalError: error?.message || 'Unknown error',
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}
