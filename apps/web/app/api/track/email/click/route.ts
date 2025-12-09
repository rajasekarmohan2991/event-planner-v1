import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const deliveryId = url.searchParams.get('d')
    const targetUrl = url.searchParams.get('url')

    if (deliveryId) {
      // Update delivery record with click timestamp
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          clickedAt: new Date(),
        },
      }).catch(err => {
        console.error('Failed to track email click:', err)
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
            totalClicked: { increment: 1 }
          }
        }).catch(err => {
          console.error('Failed to update campaign stats:', err)
        })
      }
    }

    // Redirect to target URL
    if (targetUrl) {
      return NextResponse.redirect(targetUrl)
    }

    return NextResponse.json({ error: 'Missing target URL' }, { status: 400 })
  } catch (error) {
    console.error('Email click tracking error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
