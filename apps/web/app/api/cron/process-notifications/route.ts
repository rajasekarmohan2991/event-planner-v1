import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSMS, sendWhatsApp } from '@/lib/messaging'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
// Recommended: Every 5-15 minutes

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'change-me-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Find notifications that are scheduled and due
    const dueNotifications = await prisma.scheduledNotification.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now
        }
      },
      take: 50, // Process in batches
    })

    const results = []

    for (const notification of dueNotifications) {
      try {
        // Get recipients based on filter
        const recipients = await getRecipients(notification.eventId, notification.recipientFilter as any)
        
        // Create delivery records
        const deliveries = await Promise.all(
          recipients.map(recipient =>
            prisma.notificationDelivery.create({
              data: {
                scheduledNotificationId: notification.id,
                recipientEmail: recipient.email,
                recipientPhone: recipient.phone,
                recipientUserId: recipient.userId,
                status: 'PENDING',
              }
            })
          )
        )

        // Send notifications
        let sentCount = 0
        for (const delivery of deliveries) {
          try {
            let success = false

            if (notification.type === 'EMAIL' && delivery.recipientEmail) {
              const trackingPixel = `<img src="${process.env.NEXTAUTH_URL}/api/track/email/open?d=${delivery.id}" width="1" height="1" alt="" />`
              const htmlWithTracking = notification.htmlContent 
                ? notification.htmlContent + trackingPixel
                : `<p>${notification.message}</p>${trackingPixel}`

              const result = await sendEmail({
                to: delivery.recipientEmail,
                subject: notification.subject || 'Event Notification',
                html: htmlWithTracking,
                text: notification.message,
              })
              success = result.success
            } else if (notification.type === 'SMS' && delivery.recipientPhone) {
              const result = await sendSMS(delivery.recipientPhone, notification.message)
              success = result.success
            } else if (notification.type === 'WHATSAPP' && delivery.recipientPhone) {
              const result = await sendWhatsApp(delivery.recipientPhone, notification.message)
              success = result.success
            }

            if (success) {
              await prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: {
                  status: 'SENT',
                  sentAt: new Date(),
                }
              })
              sentCount++
            } else {
              await prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: {
                  status: 'FAILED',
                  errorMessage: 'Delivery failed',
                }
              })
            }
          } catch (deliveryError: any) {
            console.error('Delivery error:', deliveryError)
            await prisma.notificationDelivery.update({
              where: { id: delivery.id },
              data: {
                status: 'FAILED',
                errorMessage: deliveryError.message,
              }
            })
          }
        }

        // Update notification status
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          }
        })

        // Update campaign stats if applicable
        if (notification.campaignId) {
          await prisma.emailCampaign.update({
            where: { id: notification.campaignId },
            data: {
              totalSent: { increment: sentCount }
            }
          })
        }

        results.push({
          notificationId: notification.id,
          sent: sentCount,
          total: deliveries.length,
        })
      } catch (notificationError: any) {
        console.error('Notification processing error:', notificationError)
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
          }
        })
        results.push({
          notificationId: notification.id,
          error: notificationError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueNotifications.length,
      results,
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

async function getRecipients(eventId: string, filter: any) {
  const recipients: Array<{ email?: string; phone?: string; userId?: bigint }> = []
  const seen = new Set<string>()

  if (filter?.includeRegistrations) {
    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        email: { not: null },
      },
      select: {
        email: true,
        userId: true,
      }
    })

    for (const reg of registrations) {
      if (reg.email && !seen.has(reg.email)) {
        seen.add(reg.email)
        recipients.push({
          email: reg.email,
          userId: reg.userId || undefined,
        })
      }
    }
  }

  if (filter?.includeRsvps) {
    const rsvps = await prisma.rSVP.findMany({
      where: {
        eventId,
        email: { not: null },
      },
      select: {
        email: true,
        userId: true,
      }
    })

    for (const rsvp of rsvps) {
      if (rsvp.email && !seen.has(rsvp.email)) {
        seen.add(rsvp.email)
        recipients.push({
          email: rsvp.email,
          userId: rsvp.userId || undefined,
        })
      }
    }
  }

  return recipients
}
