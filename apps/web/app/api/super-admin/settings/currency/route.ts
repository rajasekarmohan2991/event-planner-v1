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

    // Get global currency from super-admin tenant
    const superAdminTenant = await prisma.tenant.findFirst({
      where: { slug: 'super-admin' }
    })

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

    // Update super-admin tenant currency as global default
    const superAdminTenant = await prisma.tenant.upsert({
      where: { slug: 'super-admin' },
      update: { currency: globalCurrency },
      create: {
        slug: 'super-admin',
        name: 'Super Admin',
        subdomain: 'super-admin',
        currency: globalCurrency,
        plan: 'ENTERPRISE',
        status: 'ACTIVE'
      }
    })

    const updatedSettings = {
      globalCurrency: superAdminTenant.currency,
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
