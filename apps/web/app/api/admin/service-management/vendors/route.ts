import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

    // Polyfill for BigInt serialization
    ; (BigInt.prototype as any).toJSON = function () {
        return this.toString()
    }

// GET - List vendors linked to the current company (tenant)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = (session.user as any).role
        const currentTenantId = (session.user as any).currentTenantId

        // Only ADMIN or SUPER_ADMIN can access
        if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (!currentTenantId) {
            return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
        }

        // Fetch vendors linked to this tenant
        const vendors = await (prisma as any).vendor.findMany({
            where: {
                tenantId: currentTenantId
            },
            include: {
                services: {
                    include: {
                        packages: true
                    }
                },
                bookings: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const vendorsWithStats = vendors.map((vendor: any) => {
            const totalServices = vendor.services.length
            const totalPackages = vendor.services.reduce((sum: number, s: any) => sum + s.packages.length, 0)
            const totalBookings = vendor.bookings.length
            const totalRevenue = vendor.bookings.reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0)

            return {
                id: vendor.id,
                name: vendor.name,
                category: vendor.category,
                description: vendor.description,
                email: vendor.email,
                phone: vendor.phone,
                website: vendor.website,
                logo: vendor.logo,
                rating: vendor.rating,
                reviewCount: vendor.reviewCount,
                createdAt: vendor.createdAt,
                // Stats
                totalServices,
                totalPackages,
                totalBookings,
                totalRevenue,
                // Services preview
                services: vendor.services.slice(0, 3).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    basePrice: Number(s.basePrice)
                }))
            }
        })

        return NextResponse.json({ vendors: vendorsWithStats })
    } catch (error: any) {
        console.error('Error fetching company vendors:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create a new vendor for this company
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
            category,
            description,
            email,
            phone,
            website,
            logo,
            establishedYear,
            serviceCapacity
        } = body

        if (!name || !category) {
            return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
        }

        // Create vendor linked to this tenant
        const vendor = await (prisma as any).vendor.create({
            data: {
                name,
                category,
                description,
                email,
                phone,
                website,
                logo,
                establishedYear: establishedYear ? parseInt(establishedYear) : null,
                serviceCapacity: serviceCapacity ? parseInt(serviceCapacity) : null,
                tenantId: currentTenantId // Link to current company
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Vendor created successfully',
            vendor
        })
    } catch (error: any) {
        console.error('Error creating company vendor:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
