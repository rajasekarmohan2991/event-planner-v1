import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AVAILABLE_CURRENCIES } from '@/lib/currency'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    // Get global currency from super-admin tenant using raw SQL
    const tenants: any[] = await prisma.$queryRawUnsafe(`
      SELECT currency FROM tenants WHERE slug = 'super-admin' LIMIT 1
    `);
    
    const superAdminTenant = tenants[0];

    const settings = {
      globalCurrency: superAdminTenant?.currency || 'USD',
      allowedCurrencies: AVAILABLE_CURRENCIES.map(c => c.code),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching currency settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { globalCurrency } = body

    // Validate currency
    if (globalCurrency && !AVAILABLE_CURRENCIES.find(c => c.code === globalCurrency)) {
      return NextResponse.json({ error: 'Invalid currency code' }, { status: 400 })
    }

    // Update super-admin tenant currency as global default using raw SQL
    // First check if super-admin tenant exists
    const existing: any[] = await prisma.$queryRawUnsafe(`
      SELECT id FROM tenants WHERE slug = 'super-admin' LIMIT 1
    `);
    
    if (existing.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE tenants SET currency = $1, updated_at = NOW() WHERE slug = 'super-admin'
      `, globalCurrency);
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT INTO tenants (slug, name, subdomain, currency, plan, status, created_at, updated_at)
        VALUES ('super-admin', 'Super Admin', 'super-admin', $1, 'ENTERPRISE', 'ACTIVE', NOW(), NOW())
      `, globalCurrency);
    }

    const updatedSettings = {
      globalCurrency: globalCurrency,
      allowedCurrencies: AVAILABLE_CURRENCIES.map(c => c.code),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    })
  } catch (error: any) {
    console.error('Error updating currency settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}
