import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/promo-codes/db - Get all promo codes from database
export async function GET(req: NextRequest) {
  try {
    const permissionCheck = await checkPermissionInRoute('promo_codes.view', 'View Promo Codes')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch promo codes from database
    const promoCodes = await prisma.$queryRaw`
      SELECT 
        id::text as id,
        code,
        discount_type as "discountType",
        discount_amount as "discountValue",
        max_uses as "maxUses",
        max_uses_per_user as "maxUsesPerUser",
        min_order_amount as "minOrderAmount",
        start_date as "startDate",
        end_date as "endDate",
        is_active as active,
        created_at as "createdAt",
        (
          SELECT COUNT(*)::int 
          FROM registrations 
          WHERE data_json->>'promoCode' = promo_codes.code
        ) as "usageCount"
      FROM promo_codes
      ORDER BY created_at DESC
    `

    return NextResponse.json(promoCodes)

  } catch (error: any) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
  }
}

// POST /api/admin/promo-codes/db - Create new promo code in database
export async function POST(req: NextRequest) {
  try {
    const permissionCheck = await checkPermissionInRoute('promo_codes.create', 'Create Promo Code')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.code || !body.discountType || body.discountValue === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: code, discountType, discountValue' 
      }, { status: 400 })
    }

    // Validate discount type
    if (!['PERCENT', 'FIXED'].includes(body.discountType)) {
      return NextResponse.json({ 
        error: 'Invalid discount type. Must be PERCENT or FIXED' 
      }, { status: 400 })
    }

    // Check if code already exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM promo_codes WHERE UPPER(code) = UPPER(${body.code})
    `

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ 
        error: 'Promo code already exists' 
      }, { status: 400 })
    }

    // Create promo code
    const promoCode = await prisma.$queryRaw`
      INSERT INTO promo_codes (
        event_id,
        code,
        discount_type,
        discount_amount,
        max_uses,
        max_uses_per_user,
        min_order_amount,
        start_date,
        end_date,
        is_active,
        created_at
      ) VALUES (
        0,
        ${body.code.toUpperCase()},
        ${body.discountType},
        ${body.discountValue},
        ${body.maxUses || null},
        ${body.maxUsesPerUser || null},
        ${body.minOrderAmount || 0},
        ${body.startDate || null},
        ${body.endDate || null},
        ${body.active !== false},
        NOW()
      )
      RETURNING 
        id::text as id,
        code,
        discount_type as "discountType",
        discount_amount as "discountValue",
        max_uses as "maxUses",
        max_uses_per_user as "maxUsesPerUser",
        min_order_amount as "minOrderAmount",
        start_date as "startDate",
        end_date as "endDate",
        is_active as active,
        created_at as "createdAt"
    `

    console.log('✅ Promo code created:', (promoCode as any[])[0]?.code)

    return NextResponse.json((promoCode as any[])[0], { status: 201 })

  } catch (error: any) {
    console.error('Error creating promo code:', error)
    return NextResponse.json({ 
      error: 'Failed to create promo code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// PUT /api/admin/promo-codes/db - Update promo code
export async function PUT(req: NextRequest) {
  try {
    const permissionCheck = await checkPermissionInRoute('promo_codes.edit', 'Edit Promo Code')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 })
    }

    // Update promo code
    const updated = await prisma.$queryRaw`
      UPDATE promo_codes
      SET
        discount_amount = COALESCE(${body.discountValue}, discount_amount),
        max_uses = COALESCE(${body.maxUses}, max_uses),
        max_uses_per_user = COALESCE(${body.maxUsesPerUser}, max_uses_per_user),
        min_order_amount = COALESCE(${body.minOrderAmount}, min_order_amount),
        start_date = COALESCE(${body.startDate}, start_date),
        end_date = COALESCE(${body.endDate}, end_date),
        is_active = COALESCE(${body.active}, is_active),
        updated_at = NOW()
      WHERE id = ${BigInt(body.id)}
      RETURNING 
        id::text as id,
        code,
        discount_type as "discountType",
        discount_amount as "discountValue",
        is_active as active
    `

    if (!(updated as any[]).length) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    return NextResponse.json((updated as any[])[0])

  } catch (error: any) {
    console.error('Error updating promo code:', error)
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 })
  }
}
