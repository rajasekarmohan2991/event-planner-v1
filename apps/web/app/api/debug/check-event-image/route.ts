import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')

    if (!eventId) {
        return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    try {
        const event = await prisma.event.findUnique({
            where: { id: BigInt(eventId) },
            select: {
                id: true,
                name: true,
                bannerUrl: true
            }
        })

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        return NextResponse.json({
            eventId: String(event.id),
            name: event.name,
            bannerUrl: event.bannerUrl,
            hasBannerUrl: !!event.bannerUrl,
            bannerUrlLength: event.bannerUrl?.length || 0,
            bannerUrlPreview: event.bannerUrl?.substring(0, 100) + '...'
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
