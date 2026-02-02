import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Add meal package to a service
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; serviceId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const serviceId = params.serviceId
        const body = await req.json()
        const {
            name,
            type,
            pricePerPlate,
            minGuests,
            maxGuests,
            description,
            includedItems
        } = body

        if (!name || !type || !pricePerPlate) {
            return NextResponse.json({ error: 'Name, type, and price per plate are required' }, { status: 400 })
        }

        // Verify service exists
        const service = await prisma.vendorService.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Create meal package
        const pkg = await prisma.mealPackage.create({
            data: {
                serviceId,
                name,
                type,
                pricePerPlate,
                minGuests: minGuests || 10,
                maxGuests: maxGuests || null,
                description: description || null,
                includedItems: includedItems || null
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Meal package created successfully',
            package: pkg
        })
    } catch (error: any) {
        console.error('Error creating meal package:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
