import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE - Delete a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serviceId } = params

    await prisma.$executeRaw`DELETE FROM provider_services WHERE id = ${serviceId}`

    return NextResponse.json({ success: true, message: 'Service deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a service
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serviceId } = params
    const body = await req.json()
    const { name, description, base_price, price_unit, details, images, is_active } = body

    await prisma.$executeRaw`
      UPDATE provider_services
      SET 
        name = ${name},
        description = ${description || null},
        base_price = ${base_price || 0},
        price_unit = ${price_unit || 'per_event'},
        service_details = ${details || null}::jsonb,
        images = ${images ? JSON.stringify(images) : '[]'}::jsonb,
        is_active = ${is_active !== undefined ? is_active : true},
        updated_at = NOW()
      WHERE id = ${serviceId}
    `

    return NextResponse.json({ success: true, message: 'Service updated successfully' })
  } catch (error: any) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
