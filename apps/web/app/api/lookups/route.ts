import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/lookups?category=EVENT_TYPE&active=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'
    
    const where: any = {}
    if (category) where.category = category
    if (activeOnly) where.isActive = true
    
    const lookups = await prisma.lookup.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { label: 'asc' }
      ]
    })
    
    return NextResponse.json({ lookups, count: lookups.length })
  } catch (error: any) {
    console.error('Error fetching lookups:', error)
    return NextResponse.json({ message: error.message || 'Failed to fetch lookups' }, { status: 500 })
  }
}

// POST /api/lookups
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Only admins can create lookups
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 })
    }
    
    const body = await req.json()
    const { category, code, label, colorCode, icon, sortOrder, isActive, metadata } = body
    
    if (!category || !code || !label) {
      return NextResponse.json({ message: 'Category, code, and label are required' }, { status: 400 })
    }
    
    // Check for duplicate
    const existing = await prisma.lookup.findUnique({
      where: { category_code: { category, code } }
    })
    
    if (existing) {
      return NextResponse.json({ message: 'Lookup with this category and code already exists' }, { status: 409 })
    }
    
    const lookup = await prisma.lookup.create({
      data: {
        category,
        code,
        label,
        colorCode,
        icon,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        isSystem: false,
        metadata
      }
    })
    
    return NextResponse.json(lookup, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lookup:', error)
    return NextResponse.json({ message: error.message || 'Failed to create lookup' }, { status: 500 })
  }
}
