import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    // 1. Validate & Parse Event ID
    let eventIdBigInt
    try {
      eventIdBigInt = BigInt(eventId)
    } catch (e) {
      return NextResponse.json({ message: 'Invalid Event ID' }, { status: 400 })
    }

    // 2. Fetch Event & Tenant Details
    // Using BigInt for events.id query avoids type mismatch errors
    const events = await prisma.$queryRaw`
      SELECT name, tenant_id as "tenantId" 
      FROM events 
      WHERE id = ${eventIdBigInt} 
      LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = events[0]
    const tenantId = event.tenantId // Use the event's tenant, more reliable than context for public APIs
    const eventName = event.name

    const body = await req.json()

    // Calculate booth cost
    const boothPrices: Record<string, number> = {
      '3x3': 5000,
      '6x6': 15000,
      '9x9': 30000,
      '12x12': 50000
    }

    const boothCost = (boothPrices[body.booth_size] || 5000) * (body.number_of_booths || 1)
    const additionalFees =
      (body.power_supply ? 1000 : 0) +
      (body.lighting ? 1500 : 0) +
      (body.internet_connection ? 2000 : 0) +
      (body.storage_space ? 1000 : 0)

    const totalAmount = boothCost + additionalFees
    const confirmationToken = crypto.randomBytes(32).toString('hex')
    const exhibitorId = crypto.randomUUID()

    // Insert Exhibitor using Raw SQL
    await prisma.$executeRawUnsafe(`
      INSERT INTO exhibitors (
        id, event_id, tenant_id,
        name, company, contact_name, contact_email, contact_phone,
        website, company_description, products_services, business_address,
        booth_type, booth_option, notes,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        NOW(), NOW()
      )
    `,
      exhibitorId,
      eventId,
      tenantId,
      body.company_name || 'Unknown Company',
      body.company_name,
      body.contact_name || 'Unknown Contact',
      body.contact_email || 'noemail@example.com',
      body.contact_phone || '0000000000',
      body.website_url || '',
      body.company_description || '',
      body.products_services || '',
      [body.address, body.city, body.state_province, body.postal_code, body.country].filter(Boolean).join(', '),
      body.booth_type || 'STANDARD',
      body.booth_size || '3x3',
      `Power: ${body.power_supply}, Lighting: ${body.lighting}, Internet: ${body.internet_connection}, Storage: ${body.storage_space}. Brand: ${body.brand_name}`
    )



    // Send confirmation email
    const confirmationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${params.id}/exhibitor-registration/confirm?token=${confirmationToken}`

    sendEmail({
      to: body.contact_email,
      subject: `Confirm Your Exhibitor Registration - ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2d2d2d; }
            .button { display: inline-block; padding: 15px 30px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Confirm Your Email</h1>
              <p>Exhibitor Registration for ${eventName}</p>
            </div>
            <div class="content">
              <p>Hi <strong>${body.contact_name}</strong>,</p>
              <p>Thank you for registering as an exhibitor! Please confirm your email address to proceed with your registration.</p>
              
              <div class="info">
                <strong>Company:</strong> ${body.company_name}<br>
                <strong>Contact:</strong> ${body.contact_name}<br>
                <strong>Email:</strong> ${body.contact_email}<br>
                <strong>Booth Size:</strong> ${body.booth_size}<br>
                <strong>Total Amount:</strong> ₹${totalAmount.toLocaleString()}
              </div>
              
              <center>
                <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
              </center>
              
              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                This link will expire in 24 hours. If you didn't register, please ignore this email.
              </p>
              
              <div class="footer">
                <p>EventPlanner © 2025 | All rights reserved</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${body.contact_name},

Thank you for registering as an exhibitor for ${eventName}!

Please confirm your email address by clicking this link:
${confirmationUrl}

Company: ${body.company_name}
Booth Size: ${body.booth_size}
Total Amount: ₹${totalAmount.toLocaleString()}

This link will expire in 24 hours.

EventPlanner © 2025
      `
    }).catch(err => console.error('Failed to send confirmation email:', err))

    console.log(`Exhibitor registered for event ID: ${params.id}`)
    console.log(`Company: ${body.company_name}, Contact: ${body.contact_email}`)

    return NextResponse.json({
      message: 'Registration submitted successfully. Please check your email to confirm.',
      totalAmount,
      status: 'PENDING_CONFIRMATION',
      exhibitor: {
        id: exhibitorId,
        company: body.company_name,
        email: body.contact_email,
        status: 'PENDING_CONFIRMATION'
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Exhibitor registration error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}
