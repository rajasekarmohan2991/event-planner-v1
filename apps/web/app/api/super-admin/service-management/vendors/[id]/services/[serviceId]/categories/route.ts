import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Add menu category to a service
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
        const { name, description, sortOrder } = body

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
        }

        // Verify service exists
        const service = await prisma.vendorService.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Create menu category
        const category = await prisma.menuCategory.create({
            data: {
                serviceId,
                name,
                description: description || null,
                sortOrder: sortOrder || 0
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Menu category created successfully',
            category
        })
    } catch (error: any) {
        console.error('Error creating menu category:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
