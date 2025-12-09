import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const deliveryId = url.searchParams.get('d')

    if (deliveryId) {
      // Update delivery record with open timestamp
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          openedAt: new Date(),
          status: 'SENT', // Ensure status is SENT if it was delivered
        },
      }).catch(err => {
        console.error('Failed to track email open:', err)
      })

      // Update campaign stats
      const delivery = await prisma.notificationDelivery.findUnique({
        where: { id: deliveryId },
        include: {
          scheduledNotification: true
        }
      })

      if (delivery?.scheduledNotification?.campaignId) {
        await prisma.emailCampaign.update({
          where: { id: delivery.scheduledNotification.campaignId },
          data: {
            totalOpened: { increment: 1 }
          }
        }).catch(err => {
          console.error('Failed to update campaign stats:', err)
        })
      }
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Email open tracking error:', error)
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    return new NextResponse(pixel, {
      headers: { 'Content-Type': 'image/gif' },
    })
  }
}
