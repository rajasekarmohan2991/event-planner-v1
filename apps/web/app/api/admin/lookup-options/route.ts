import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/lookup-options - Get all lookup options or by category
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let query = `
      SELECT 
        id::text,
        category,
        option_key as "optionKey",
        option_value as "optionValue",
        option_label as "optionLabel",
        display_order as "displayOrder",
        is_active as "isActive",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM lookup_options
    `

    const params: any[] = []
    if (category) {
      query += ` WHERE category = $1`
      params.push(category)
    }

    query += ` ORDER BY category, display_order, option_label`

    const options = await prisma.$queryRawUnsafe<any[]>(query, ...params)

    return NextResponse.json(options)
  } catch (error: any) {
    console.error('Error fetching lookup options:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch lookup options',
      message: error.message
    }, { status: 500 })
  }
}

// POST /api/admin/lookup-options - Create new lookup option
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).user.role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { category, optionKey, optionValue, optionLabel, displayOrder, isActive, metadata } = body

    if (!category || !optionKey || !optionValue || !optionLabel) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'category, optionKey, optionValue, and optionLabel are required'
      }, { status: 400 })
    }

    // Check if option already exists
    const existing = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id FROM lookup_options
      WHERE category = $1 AND option_key = $2
    `, category, optionKey)

    if (existing.length > 0) {
      return NextResponse.json({ 
        error: 'Option already exists',
        message: 'An option with this category and key already exists'
      }, { status: 409 })
    }

    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO lookup_options (
        category, option_key, option_value, option_label, display_order, is_active, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW()
      )
      RETURNING 
        id::text,
        category,
        option_key as "optionKey",
        option_value as "optionValue",
        option_label as "optionLabel",
        display_order as "displayOrder",
        is_active as "isActive",
        metadata,
        created_at as "createdAt"
    `, category, optionKey, optionValue, optionLabel, displayOrder || 0, isActive !== false, metadata ? JSON.stringify(metadata) : null)

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating lookup option:', error)
    return NextResponse.json({ 
      error: 'Failed to create lookup option',
      message: error.message
    }, { status: 500 })
  }
}
