import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Add service to vendor
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
    const { name, description, base_price, price_unit, details, images, category_id } = body

    if (!name) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
    }

    // Create service
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO provider_services (
        provider_id, name, description, base_price, price_unit,
        service_details, images, is_active, created_at
      ) VALUES (
        ${vendorId}, ${name}, ${description || null}, ${base_price || 0},
        ${price_unit || 'per_event'}, ${details || null}::jsonb, 
        ${images ? JSON.stringify(images) : '[]'}::jsonb, true, NOW()
      )
      RETURNING id
    `

    return NextResponse.json({ success: true, serviceId: result[0]?.id })
  } catch (error: any) {
    console.error('Error adding service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
