import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get vendor details with categories and services
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id

    // Fetch vendor details
    const vendor = await prisma.$queryRaw<any[]>`
      SELECT 
        id, company_name, email, phone, website, description,
        address, city, state, country, postal_code,
        verification_status as status, avg_rating, total_reviews,
        commission_rate, created_at
      FROM service_providers
      WHERE id = ${vendorId} AND provider_type = 'VENDOR'
      LIMIT 1
    `

    if (!vendor || vendor.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Fetch categories for this vendor
    const categories = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT pc.id, pc.name, pc.description
      FROM provider_categories pc
      JOIN provider_category_links pcl ON pc.id = pcl.category_id
      WHERE pcl.provider_id = ${vendorId}
      ORDER BY pc.name
    `

    // Fetch services for this vendor
    const services = await prisma.$queryRaw<any[]>`
      SELECT 
        ps.id, ps.name, ps.description, ps.base_price, ps.price_unit,
        ps.is_active, ps.service_details as details, ps.images,
        pcl.category_id
      FROM provider_services ps
      LEFT JOIN provider_category_links pcl ON ps.provider_id = pcl.provider_id
      WHERE ps.provider_id = ${vendorId}
      ORDER BY ps.name
    `

    // Organize services by category
    const categoriesWithServices = categories.map((cat: any) => ({
      ...cat,
      services: services.filter((s: any) => s.category_id === cat.id)
    }))

    // Add uncategorized services
    const uncategorizedServices = services.filter((s: any) => !s.category_id)
    if (uncategorizedServices.length > 0) {
      categoriesWithServices.push({
        id: 'uncategorized',
        name: 'Other Services',
        description: 'Services without a specific category',
        services: uncategorizedServices
      })
    }

    return NextResponse.json({
      vendor: {
        ...vendor[0],
        categories: categoriesWithServices
      }
    })
  } catch (error: any) {
    console.error('Error fetching vendor details:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update vendor details
export async function PUT(
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
    const {
      company_name, email, phone, website, description,
      address, city, state, country, postal_code,
      commission_rate, status
    } = body

    await prisma.$executeRaw`
      UPDATE service_providers
      SET 
        company_name = ${company_name},
        email = ${email},
        phone = ${phone || null},
        website = ${website || null},
        description = ${description || null},
        address = ${address || null},
        city = ${city || null},
        state = ${state || null},
        country = ${country || null},
        postal_code = ${postal_code || null},
        commission_rate = ${commission_rate || 15},
        verification_status = ${status || 'PENDING'},
        updated_at = NOW()
      WHERE id = ${vendorId}
    `

    return NextResponse.json({ success: true, message: 'Vendor updated successfully' })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete vendor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id

    // Delete services first
    await prisma.$executeRaw`DELETE FROM provider_services WHERE provider_id = ${vendorId}`
    
    // Delete category links
    await prisma.$executeRaw`DELETE FROM provider_category_links WHERE provider_id = ${vendorId}`
    
    // Delete vendor
    await prisma.$executeRaw`DELETE FROM service_providers WHERE id = ${vendorId}`

    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
