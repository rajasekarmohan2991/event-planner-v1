import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { token } = await req.json()
    const eventId = BigInt(params.id)

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find exhibitor by confirmation token
    const exhibitors = await prisma.$queryRaw<any[]>`
      SELECT 
        id, event_id, name, company_name as company, contact_name, contact_email,
        booth_size, booth_type, booth_option, booth_area,
        payment_amount, payment_method, payment_status, status,
        email_confirmed, confirmation_token
      FROM exhibitor_registrations
      WHERE event_id = ${eventId} 
        AND confirmation_token = ${token}
        AND email_confirmed = false
      LIMIT 1
    `

    if (exhibitors.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired confirmation link' 
      }, { status: 404 })
    }

    const exhibitor = exhibitors[0]
    const exhibitorId = exhibitor.id

    // Update exhibitor - confirm email and set status to PENDING_PAYMENT
    await prisma.$executeRaw`
      UPDATE exhibitor_registrations
      SET email_confirmed = true,
          status = 'PENDING_PAYMENT',
          updated_at = NOW()
      WHERE id = ${exhibitorId}
    `

    // Get event details
    const events = await prisma.$queryRaw<any[]>`
      SELECT id, name, starts_at, ends_at
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `
    const event = events[0]

    // Calculate amount breakdown
    const boothCost = exhibitor.payment_amount || 0
    const baseAmount = boothCost * 0.85 // Assuming 85% is base cost
    const gst = boothCost * 0.18 // 18% GST
    const serviceFee = boothCost - baseAmount - gst

    // Create payment link (you can integrate with Razorpay/Stripe here)
    const paymentLink = `${process.env.NEXTAUTH_URL}/events/${params.id}/exhibitor-registration/payment?exhibitorId=${exhibitorId}`

    // Send detailed confirmation email with payment information
    await sendEmail({
      to: exhibitor.contact_email,
      subject: `Email Confirmed - Complete Payment for ${event.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
            .amount-breakdown { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #E5E7EB; }
            .amount-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
            .amount-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #10B981; border-bottom: none; margin-top: 10px; padding-top: 15px; }
            .button { display: inline-block; padding: 15px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .info { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Confirmed!</h1>
              <p>Complete Your Payment to Secure Your Booth</p>
            </div>
            <div class="content">
              <div class="success">
                <h2 style="margin-top: 0; color: #059669;">Email Verification Successful</h2>
                <p style="margin-bottom: 0;">Your email has been confirmed. Please complete the payment to secure your booth.</p>
              </div>

              <h3>Registration Details</h3>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Company:</strong> ${exhibitor.company || exhibitor.name}</p>
                <p><strong>Contact Person:</strong> ${exhibitor.contact_name}</p>
                <p><strong>Email:</strong> ${exhibitor.contact_email}</p>
                <p><strong>Booth Type:</strong> ${exhibitor.booth_type || 'Standard'}</p>
                <p><strong>Booth Size:</strong> ${exhibitor.booth_size || exhibitor.booth_area || 'TBD'}</p>
                ${exhibitor.booth_option ? `<p><strong>Booth Option:</strong> ${exhibitor.booth_option}</p>` : ''}
              </div>

              <h3>Payment Details</h3>
              <div class="amount-breakdown">
                <h4 style="margin-top: 0; color: #374151;">Amount Breakdown</h4>
                <div class="amount-row">
                  <span>Base Booth Cost</span>
                  <span>₹${Math.round(baseAmount).toLocaleString()}</span>
                </div>
                <div class="amount-row">
                  <span>Service Fee</span>
                  <span>₹${Math.round(serviceFee).toLocaleString()}</span>
                </div>
                <div class="amount-row">
                  <span>GST (18%)</span>
                  <span>₹${Math.round(gst).toLocaleString()}</span>
                </div>
                <div class="amount-row total">
                  <span>Total Amount</span>
                  <span>₹${Math.round(boothCost).toLocaleString()}</span>
                </div>
              </div>

              <div class="info">
                <strong>📌 Payment Instructions:</strong><br>
                • Payment Method: ${exhibitor.payment_method || 'Online Payment / Bank Transfer'}<br>
                • Payment must be completed within 48 hours<br>
                • After payment, your booth will be confirmed<br>
                • You'll receive a confirmation email with QR code<br>
                • Event Date: ${event.starts_at ? new Date(event.starts_at).toLocaleDateString() : 'TBD'}
              </div>

              <center>
                <a href="${paymentLink}" class="button">Complete Payment Now</a>
              </center>

              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
            <div class="footer">
              <p>EventPlanner © 2025 | All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Email Confirmed - Complete Payment for ${event.name}

Your email has been confirmed successfully!

Registration Details:
- Company: ${exhibitor.company || exhibitor.name}
- Contact: ${exhibitor.contact_name}
- Booth Type: ${exhibitor.booth_type || 'Standard'}

Payment Details:
- Base Cost: ₹${Math.round(baseAmount).toLocaleString()}
- Service Fee: ₹${Math.round(serviceFee).toLocaleString()}
- GST (18%): ₹${Math.round(gst).toLocaleString()}
- Total Amount: ₹${Math.round(boothCost).toLocaleString()}

Payment Method: ${exhibitor.payment_method || 'Online Payment / Bank Transfer'}

Complete your payment here: ${paymentLink}

Payment must be completed within 48 hours to secure your booth.

EventPlanner © 2025
      `
    }).catch(err => console.error('Failed to send confirmation email:', err))

    return NextResponse.json({
      message: 'Email confirmed successfully! Please complete the payment to secure your booth.',
      exhibitor: {
        id: exhibitorId.toString(),
        company: exhibitor.company || exhibitor.name,
        contactName: exhibitor.contact_name,
        contactEmail: exhibitor.contact_email,
        totalAmount: boothCost,
        paymentMethod: exhibitor.payment_method,
        paymentLink: paymentLink,
        status: 'PENDING_PAYMENT'
      }
    })

  } catch (error: any) {
    console.error('Email confirmation error:', error)
    return NextResponse.json({ 
      error: 'Failed to confirm email',
      details: error.message 
    }, { status: 500 })
  }
}
