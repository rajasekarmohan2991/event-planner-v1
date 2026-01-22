import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Save menu items and packages for a vendor
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
    const { menuItems, packages } = body

    // Store menu items and packages as JSON in provider_services or a dedicated table
    // First, ensure the vendor_menu table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS vendor_menus (
        id BIGSERIAL PRIMARY KEY,
        vendor_id BIGINT NOT NULL,
        menu_items JSONB DEFAULT '[]'::jsonb,
        packages JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Check if vendor menu exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM vendor_menus WHERE vendor_id = ${parseInt(vendorId)} LIMIT 1
    `

    if (existing && existing.length > 0) {
      // Update existing
      await prisma.$executeRaw`
        UPDATE vendor_menus
        SET 
          menu_items = ${JSON.stringify(menuItems || [])}::jsonb,
          packages = ${JSON.stringify(packages || [])}::jsonb,
          updated_at = NOW()
        WHERE vendor_id = ${parseInt(vendorId)}
      `
    } else {
      // Insert new
      await prisma.$executeRaw`
        INSERT INTO vendor_menus (vendor_id, menu_items, packages)
        VALUES (${parseInt(vendorId)}, ${JSON.stringify(menuItems || [])}::jsonb, ${JSON.stringify(packages || [])}::jsonb)
      `
    }

    return NextResponse.json({ success: true, message: 'Menu saved successfully' })
  } catch (error: any) {
    console.error('Error saving menu:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get menu items and packages for a vendor
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

    try {
      const menu = await prisma.$queryRaw<any[]>`
        SELECT menu_items, packages FROM vendor_menus 
        WHERE vendor_id = ${parseInt(vendorId)} 
        LIMIT 1
      `

      if (menu && menu.length > 0) {
        return NextResponse.json({
          menuItems: menu[0].menu_items || [],
          packages: menu[0].packages || []
        })
      }

      return NextResponse.json({ menuItems: [], packages: [] })
    } catch (dbError: any) {
      // Table doesn't exist yet
      if (dbError.message?.includes('does not exist')) {
        return NextResponse.json({ menuItems: [], packages: [] })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching menu:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
