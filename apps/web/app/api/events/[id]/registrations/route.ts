import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSMS, buildShareLink } from '@/lib/messaging'
import { logActivity, ActivityActions, EntityTypes } from '@/lib/activity'
import { getTenantId } from '@/lib/tenant-context'

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
      whereConditions.push(`(data_json->>'status') = $${paramIndex}`)
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
    
    const eventId = parseInt(params.id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }

    // Build registration data JSON from form data
    const formData = parsed?.data || parsed
    
    // Validate required fields
    if (!formData?.email || !formData?.firstName || !formData?.lastName) {
      return NextResponse.json({ 
        message: 'Missing required fields: email, firstName, and lastName are required' 
      }, { status: 400 })
    }
    
    // Extract payment and promo code info
    // Check multiple locations for price (formData might not have it if it's sent at root level)
    const totalPrice = formData.totalPrice || formData.priceInr || parsed.priceInr || parsed.totalPrice || 0
    const promoCode = formData.promoCode || parsed.promoCode || null
    const paymentMethod = formData.paymentMethod || 'CARD'
    const selectedSeats = formData.selectedSeats || []
    
    // Calculate final amount (will be adjusted if promo code is valid)
    let finalAmount = totalPrice
    let discountAmount = 0
    let promoCodeId: string | null = null
    
    // Validate and apply promo code if provided
    if (promoCode) {
      try {
        const promoResult = await prisma.$queryRaw`
          SELECT 
            id::text as id,
            code,
            type,
            amount,
            max_redemptions as "maxRedemptions",
            per_user_limit as "perUserLimit",
            starts_at as "startsAt",
            ends_at as "endsAt",
            min_order_amount as "minOrderAmount",
            status
          FROM promo_codes
          WHERE code = ${promoCode}
            AND scope_ref = ${eventId.toString()}
            AND status = 'ACTIVE'
        ` as any[]
        
        if (promoResult.length > 0) {
          const promo = promoResult[0]
          const now = new Date()
          
          // Validate promo code
          if (promo.startsAt && new Date(promo.startsAt) > now) {
            return NextResponse.json({ message: 'Promo code not yet active' }, { status: 400 })
          }
          if (promo.endsAt && new Date(promo.endsAt) < now) {
            return NextResponse.json({ message: 'Promo code has expired' }, { status: 400 })
          }
          if (promo.minOrderAmount && totalPrice < Number(promo.minOrderAmount)) {
            return NextResponse.json({ 
              message: `Minimum order amount of ${promo.minOrderAmount} required for this promo code` 
            }, { status: 400 })
          }
          
          // Check usage limits
          const usageCount = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM promo_redemptions
            WHERE promo_code_id = ${BigInt(promo.id)}
          ` as any[]
          
          if (promo.maxRedemptions && usageCount[0].count >= promo.maxRedemptions) {
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
    
    const registrationData = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || '',
      jobTitle: formData.jobTitle || '',
      company: formData.company || '',
      sessionPreferences: formData.sessionPreferences || [],
      type: parsed?.type || 'VIRTUAL',
      userId: (session as any)?.user?.id || null,
      registeredAt: new Date().toISOString(),
      status: 'CONFIRMED', // Set to CONFIRMED for paid registrations
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

    // Insert using raw SQL to match actual table structure
    const created = await prisma.$queryRaw`
      INSERT INTO registrations (event_id, data_json, type, email, created_at)
      VALUES (${eventId}, ${JSON.stringify(registrationData)}::jsonb, ${parsed?.type || 'VIRTUAL'}, ${registrationData.email}, NOW())
      RETURNING id::text as id, event_id as "eventId", data_json as "dataJson", type, email, created_at as "createdAt"
    `

    const registration = (created as any)[0]
    
    if (!registration) {
      throw new Error('Failed to create registration')
    }
    
    const registrationId = BigInt(registration.id)
    const userId = (session as any)?.user?.id ? BigInt((session as any).user.id) : null
    
    // Create payment record
    try {
      const amountInMinor = Math.round(finalAmount * 100) // Convert to minor units (paise)
      const paymentStatus = finalAmount > 0 ? 'COMPLETED' : 'FREE'
      
      await prisma.$executeRaw`
        INSERT INTO payments (
          registration_id,
          event_id,
          user_id,
          amount_in_minor,
          currency,
          status,
          payment_method,
          payment_details,
          created_at,
          updated_at
        ) VALUES (
          ${registrationId},
          ${eventId},
          ${userId},
          ${amountInMinor},
          'INR',
          ${paymentStatus},
          ${paymentMethod},
          ${JSON.stringify({
            originalAmount: totalPrice,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            promoCode: promoCode,
            paymentMethod: paymentMethod
          })}::jsonb,
          NOW(),
          NOW()
        )
      `
      
      console.log(`Payment record created for registration ${registration.id}: ${finalAmount} INR`)
    } catch (paymentError) {
      console.error('Failed to create payment record:', paymentError)
      // Continue even if payment record creation fails
    }
    
    // Create promo code redemption record if promo was used
    if (promoCodeId && userId) {
      try {
        await prisma.$executeRaw`
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
        console.log(`Promo code ${promoCode} redeemed for registration ${registration.id}`)
      } catch (redemptionError) {
        console.error('Failed to create promo redemption record:', redemptionError)
        // Continue even if redemption record creation fails
      }
    }
    
    // Create registration approval record for tracking
    try {
      await prisma.$executeRaw`
        INSERT INTO registration_approvals (
          registration_id,
          event_id,
          status,
          created_at
        ) VALUES (
          ${registrationId},
          ${eventId},
          'APPROVED',
          NOW()
        )
      `
    } catch (approvalError) {
      console.error('Failed to create approval record:', approvalError)
      // Continue even if approval record creation fails
    }

    // Convert registration to plain object (handle BigInt)
    const parsedDataJson = typeof registration.dataJson === 'string' ? JSON.parse(registration.dataJson) : registration.dataJson

    const registrationData_response = {
      id: String(registration.id),
      eventId: Number(registration.eventId),
      dataJson: parsedDataJson,
      type: registration.type,
      createdAt: registration.createdAt
    }

    // Generate QR code for check-in
    const qrData = {
      registrationId: String(registration.id),
      eventId: eventId,
      email: registrationData.email,
      name: `${registrationData.firstName} ${registrationData.lastName}`.trim(),
      type: registrationData.type,
      timestamp: new Date().toISOString()
    }
    
    // Add QR code data to response
    const response = {
      ...registrationData_response,
      qrCode: Buffer.from(JSON.stringify(qrData)).toString('base64'),
      checkInUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${eventId}/checkin?token=${Buffer.from(JSON.stringify(qrData)).toString('base64')}`
    }

    // Fetch event name for activity logging
    const eventResult = await prisma.$queryRaw`
      SELECT name FROM events WHERE id = ${eventId}::bigint LIMIT 1
    ` as any[]
    const eventName = eventResult.length > 0 ? eventResult[0].name : `Event #${eventId}`

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
        eventId,
        eventName,
        type: registrationData.type,
        amount: finalAmount,
        promoCode: promoCode || undefined
      }
    }).catch(err => console.error('Failed to log registration activity:', err))

    // Send confirmation email with QR code (async, don't wait)
    if (registrationData.email) {
      const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(response.qrCode)}`
      
      sendEmail({
        to: registrationData.email,
        subject: 'Event Registration Confirmation - Your Ticket',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .qr-code { margin: 20px 0; }
              .qr-code img { max-width: 200px; height: auto; border: 3px solid #667eea; border-radius: 10px; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Registration Confirmed!</h1>
                <p>Your ticket is ready</p>
              </div>
              <div class="content">
                <p>Hi <strong>${registrationData.firstName}</strong>,</p>
                <p>Thank you for registering! Your event ticket has been generated.</p>
                
                <div class="ticket">
                  <h2>Your Event Ticket</h2>
                  <div class="info">
                    <strong>Registration ID:</strong> ${String(registration.id)}<br>
                    <strong>Name:</strong> ${registrationData.firstName} ${registrationData.lastName}<br>
                    <strong>Email:</strong> ${registrationData.email}<br>
                    <strong>Type:</strong> ${registrationData.type}
                  </div>
                  
                  <div class="qr-code">
                    <p><strong>Your QR Code Ticket:</strong></p>
                    <img src="${qrCodeImageUrl}" alt="QR Code Ticket" />
                    <p style="font-size: 12px; color: #666;">Show this QR code at the event entrance</p>
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
    console.error('Error creating registration:', error)
    return NextResponse.json({ 
      message: error?.message || 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
