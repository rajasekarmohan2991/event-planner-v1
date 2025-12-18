import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const permError = await checkPermissionInRoute('events.manage_registrations', 'Allocate Booth')
    if (permError) return permError

    try {
        const body = await req.json()
        const { boothNumber, boothArea } = body
        const userId = (session as any)?.user?.id

        if (!boothNumber) {
            return NextResponse.json({ message: 'Booth number required' }, { status: 400 })
        }

        const exhibitor = await prisma.exhibitor.findUnique({
            where: { id: params.exhibitorId },
            include: { booths: true }
        })

        if (!exhibitor) {
            return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
        }

        if (exhibitor.paymentStatus !== 'COMPLETED') {
            return NextResponse.json({ message: 'Payment must be completed first' }, { status: 400 })
        }

        // Generate QR code data
        const checkInCode = `EXH-${params.id}-${exhibitor.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

        const qrData = {
            type: 'EXHIBITOR',
            exhibitorId: exhibitor.id,
            eventId: params.id,
            company: exhibitor.name,
            contactEmail: exhibitor.contactEmail,
            boothNumber: boothNumber,
            checkInCode: checkInCode,
            timestamp: new Date().toISOString()
        }

        // Generate QR code image
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
        } catch (qrError) {
            console.error('QR code generation failed:', qrError)
        }

        // Update exhibitor with booth allocation and QR code
        const updated = await prisma.exhibitor.update({
            where: { id: params.exhibitorId },
            data: {
                boothAllocated: true,
                boothNumber: boothNumber,
                boothArea: boothArea,
                allocatedBy: userId,
                allocatedAt: new Date(),
                qrCode: qrCodeDataURL,
                qrCodeData: JSON.stringify(qrData),
                checkInCode: checkInCode,
                status: 'CONFIRMED'
            }
        })

        // Update booth record
        const booth = exhibitor.booths.find(b => b.status === 'ASSIGNED')
        if (booth) {
            await prisma.booth.update({
                where: { id: booth.id },
                data: {
                    boothNumber: boothNumber,
                    status: 'CONFIRMED'
                }
            })
        }

        // Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: BigInt(params.id) },
            select: { name: true, startsAt: true }
        })
        const eventName = event?.name || `Event #${params.id}`

        // Send booth allocation email with QR code
        const to = exhibitor.contactEmail || ''
        if (to && qrCodeDataURL) {
            sendEmail({
                to,
                subject: `Booth Allocated - ${eventName}`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .booth-info { background: white; border: 2px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .booth-number { font-size: 48px; font-weight: bold; color: #8b5cf6; margin: 10px 0; }
              .qr-code { margin: 20px 0; }
              .qr-code img { max-width: 300px; height: auto; border: 3px solid #8b5cf6; border-radius: 10px; }
              .check-in-code { background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 18px; font-weight: bold; color: #8b5cf6; margin: 10px 0; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #8b5cf6; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Booth Allocated!</h1>
                <p>Exhibitor Registration for ${eventName}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName}</strong>,</p>
                
                <div class="success">
                  <strong>✓ Your booth has been allocated!</strong>
                </div>
                
                <div class="booth-info">
                  <h2 style="margin-top: 0;">Your Booth</h2>
                  <div class="booth-number">#${boothNumber}</div>
                  ${boothArea ? `<p><strong>Area:</strong> ${boothArea}</p>` : ''}
                  <p style="color: #666; font-size: 14px;">Please note your booth number</p>
                </div>
                
                <div class="info">
                  <strong>Company:</strong> ${exhibitor.name}<br>
                  <strong>Booth Size:</strong> ${exhibitor.boothOption}<br>
                  <strong>Event Date:</strong> ${event?.startsAt ? new Date(event.startsAt).toLocaleDateString() : 'TBD'}
                </div>
                
                <div class="qr-code">
                  <p><strong>Your Exhibitor QR Code:</strong></p>
                  <img src="${qrCodeDataURL}" alt="Exhibitor QR Code" />
                  <p style="font-size: 12px; color: #666;">Show this QR code for event access and booth check-in</p>
                </div>
                
                <div class="check-in-code">
                  Check-in Code: ${checkInCode}
                </div>
                
                <div class="info">
                  <strong>📱 Important:</strong><br>
                  • Save this email or screenshot the QR code<br>
                  • Arrive early for booth setup<br>
                  • Bring this QR code for quick check-in<br>
                  • Contact organizer for any questions
                </div>
                
                <p>We look forward to seeing you at ${eventName}!</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
            }).catch(err => console.error('Failed to send booth allocation email:', err))
        }

        console.log(`Booth allocated for exhibitor: ${exhibitor.id}, Booth: ${boothNumber}`)

        return NextResponse.json({
            message: 'Booth allocated successfully',
            exhibitor: {
                id: updated.id,
                company: updated.name,
                status: updated.status,
                boothNumber: updated.boothNumber,
                boothArea: updated.boothArea,
                checkInCode: updated.checkInCode,
                qrCode: updated.qrCode
            }
        })
    } catch (e: any) {
        console.error('Booth allocation error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
