import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Add menu item to a category
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; serviceId: string; categoryId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const categoryId = params.categoryId
        const body = await req.json()
        const {
            name,
            type,
            cuisine,
            description,
            imageUrls,
            allergens,
            priceImpact,
            isCustomizable
        } = body

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
        }

        // Verify category exists
        const category = await prisma.menuCategory.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        // Create menu item
        const item = await prisma.menuItem.create({
            data: {
                categoryId,
                name,
                type,
                cuisine: cuisine || null,
                description: description || null,
                imageUrls: imageUrls || null,
                allergens: allergens || null,
                priceImpact: priceImpact || 0,
                isCustomizable: isCustomizable || false
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Menu item created successfully',
            item
        })
    } catch (error: any) {
        console.error('Error creating menu item:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
