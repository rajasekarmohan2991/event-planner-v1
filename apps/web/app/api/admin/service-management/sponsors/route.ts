import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

    // Polyfill for BigInt serialization
    (BigInt.prototype as any).toJSON = function () {
        return this.toString()
    }

// GET - List sponsors for events belonging to this company
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = (session.user as any).role
        const currentTenantId = (session.user as any).currentTenantId

        if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (!currentTenantId) {
            return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
        }

        // Get all events for this tenant
        const tenantEvents = await prisma.event.findMany({
            where: { tenantId: currentTenantId },
            select: { id: true }
        })

        const eventIds = tenantEvents.map(e => e.id)

        // Fetch sponsors for these events
        const sponsors = await prisma.sponsor.findMany({
            where: {
                eventId: { in: eventIds }
            },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                packages: true,
                assets: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const sponsorsWithStats = sponsors.map(sponsor => {
            const totalPackages = sponsor.packages.length
            const totalValue = sponsor.packages.reduce((sum, p) => sum + Number(p.price || 0), 0)
            const totalAssets = sponsor.assets.length

            return {
                id: sponsor.id,
                name: sponsor.name,
                industry: sponsor.industry,
                website: sponsor.website,
                logo: sponsor.logo,
                contactName: sponsor.contactName,
                contactEmail: sponsor.contactEmail,
                contactPhone: sponsor.contactPhone,
                status: sponsor.status,
                eventId: sponsor.eventId.toString(),
                eventName: sponsor.event?.name,
                createdAt: sponsor.createdAt,
                // Stats
                totalPackages,
                totalValue,
                totalAssets,
                // Packages preview
                packages: sponsor.packages.slice(0, 3).map(p => ({
                    id: p.id,
                    name: p.name,
                    tier: p.tier,
                    price: Number(p.price)
                }))
            }
        })

        return NextResponse.json({ sponsors: sponsorsWithStats })
    } catch (error: any) {
        console.error('Error fetching company sponsors:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create a new sponsor for an event belonging to this company
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = (session.user as any).role
        const currentTenantId = (session.user as any).currentTenantId

        if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (!currentTenantId) {
            return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
        }

        const body = await req.json()
        const {
            name,
            industry,
            website,
            logo,
            description,
            contactName,
            contactEmail,
            contactPhone,
            eventId
        } = body

        if (!name || !eventId) {
            return NextResponse.json({ error: 'Name and Event are required' }, { status: 400 })
        }

        // Verify the event belongs to this tenant
        const event = await prisma.event.findFirst({
            where: {
                id: BigInt(eventId),
                tenantId: currentTenantId
            }
        })

        if (!event) {
            return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 })
        }

        // Create sponsor
        const sponsor = await prisma.sponsor.create({
            data: {
                name,
                industry,
                website,
                logo,
                description,
                contactName,
                contactEmail,
                contactPhone,
                eventId: BigInt(eventId)
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Sponsor created successfully',
            sponsor: { ...sponsor, id: sponsor.id, eventId: sponsor.eventId.toString() }
        })
    } catch (error: any) {
        console.error('Error creating company sponsor:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
