import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

    // Polyfill for BigInt serialization
    ; (BigInt.prototype as any).toJSON = function () {
        return this.toString()
    }

// GET - List exhibitors for events belonging to this company
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

        // Fetch exhibitors linked to this tenant OR for events belonging to this tenant
        const exhibitors = await (prisma as any).exhibitor.findMany({
            where: {
                OR: [
                    { tenantId: currentTenantId },
                    {
                        event: {
                            tenantId: currentTenantId
                        }
                    }
                ]
            },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                booths: true,
                products: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const exhibitorsWithStats = exhibitors.map((exhibitor: any) => {
            const totalBooths = exhibitor.booths.length
            const totalProducts = exhibitor.products.length
            const totalRevenue = exhibitor.booths.reduce((sum: number, b: any) => sum + (b.priceInr || 0), 0)

            return {
                id: exhibitor.id,
                name: exhibitor.name,
                company: exhibitor.company,
                contactName: exhibitor.contactName,
                contactEmail: exhibitor.contactEmail,
                contactPhone: exhibitor.contactPhone,
                website: exhibitor.website,
                companyDescription: exhibitor.companyDescription,
                status: exhibitor.status,
                paymentStatus: exhibitor.paymentStatus,
                boothNumber: exhibitor.boothNumber,
                boothType: exhibitor.boothType,
                eventId: exhibitor.eventId,
                eventName: exhibitor.event?.name,
                createdAt: exhibitor.createdAt,
                // Stats
                totalBooths,
                totalProducts,
                totalRevenue,
                // Products preview
                products: exhibitor.products.slice(0, 3).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category
                }))
            }
        })

        return NextResponse.json({ exhibitors: exhibitorsWithStats })
    } catch (error: any) {
        console.error('Error fetching company exhibitors:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create a new exhibitor for an event belonging to this company
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
            company,
            contactName,
            contactEmail,
            contactPhone,
            website,
            companyDescription,
            productsServices,
            boothType,
            eventId
        } = body

        if (!name || !eventId) {
            return NextResponse.json({ error: 'Name and Event are required' }, { status: 400 })
        }

        // Verify the event belongs to this tenant
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                tenantId: currentTenantId
            }
        })

        if (!event) {
            return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 })
        }

        // Create exhibitor
        const exhibitor = await (prisma as any).exhibitor.create({
            data: {
                name,
                company,
                contactName,
                contactEmail,
                contactPhone,
                website,
                companyDescription,
                productsServices,
                boothType,
                eventId,
                tenantId: currentTenantId,
                status: 'PENDING_CONFIRMATION'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Exhibitor created successfully',
            exhibitor
        })
    } catch (error: any) {
        console.error('Error creating company exhibitor:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
