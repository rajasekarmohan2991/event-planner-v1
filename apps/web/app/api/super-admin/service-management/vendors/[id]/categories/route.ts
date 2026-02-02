import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Add category to vendor
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Create or get category
    const existingCategory = await prisma.$queryRaw<any[]>`
      SELECT id FROM provider_categories 
      WHERE name = ${name} AND provider_type = 'VENDOR'
      LIMIT 1
    `

    let categoryId: string

    if (existingCategory && existingCategory.length > 0) {
      categoryId = existingCategory[0].id
    } else {
      const newCategory = await prisma.$queryRaw<any[]>`
        INSERT INTO provider_categories (name, description, provider_type, created_at)
        VALUES (${name}, ${description || null}, 'VENDOR', NOW())
        RETURNING id
      `
      categoryId = newCategory[0].id
    }

    // Link category to vendor
    await prisma.$executeRaw`
      INSERT INTO provider_category_links (provider_id, category_id)
      VALUES (${vendorId}, ${categoryId})
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({ success: true, categoryId })
  } catch (error: any) {
    console.error('Error adding category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
