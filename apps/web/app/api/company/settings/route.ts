import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AVAILABLE_CURRENCIES } from '@/lib/currency'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let tenantId = (session.user as any).currentTenantId
    const userRole = (session.user as any).role

    // Fallback for SUPER_ADMIN if no tenant context
    if (!tenantId && userRole === 'SUPER_ADMIN') {
      const defaultTenant = await prisma.tenant.findFirst({
        where: { slug: 'default' }
      }) || await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' }
      })
      
      if (defaultTenant) {
        tenantId = defaultTenant.id
      }
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context found' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        slug: true,
        plan: true,
        currency: true,
        timezone: true,
        dateFormat: true,
        status: true,
        createdAt: true,
        subdomain: true
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const settings = {
      companyName: tenant.name,
      companySlug: tenant.slug,
      plan: tenant.plan,
      currency: tenant.currency || 'USD',
      timezone: tenant.timezone || 'UTC',
      dateFormat: tenant.dateFormat || 'MM/DD/YYYY',
      status: tenant.status,
      createdAt: tenant.createdAt,
      subdomain: tenant.subdomain
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching company settings:', error)
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
    const tenantId = (session.user as any).currentTenantId
    
    // Allow TENANT_ADMIN to update settings as well
    if (!['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fallback for SUPER_ADMIN if no tenant context
    let targetTenantId = tenantId
    if (!targetTenantId && userRole === 'SUPER_ADMIN') {
      const defaultTenant = await prisma.tenant.findFirst({
        where: { slug: 'default' }
      }) || await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' }
      })
      
      if (defaultTenant) {
        targetTenantId = defaultTenant.id
      }
    }

    if (!targetTenantId) {
      return NextResponse.json({ error: 'No tenant context found' }, { status: 400 })
    }

    const body = await req.json()
    const { currency, timezone, dateFormat } = body

    // Validate currency
    if (currency && !AVAILABLE_CURRENCIES.find(c => c.code === currency)) {
      return NextResponse.json({ error: 'Invalid currency code' }, { status: 400 })
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: targetTenantId },
      data: {
        ...(currency && { currency }),
        ...(timezone && { timezone }),
        ...(dateFormat && { dateFormat }),
      }
    })

    return NextResponse.json({
      success: true,
      settings: {
        companyName: updatedTenant.name,
        plan: updatedTenant.plan,
        currency: updatedTenant.currency,
        timezone: updatedTenant.timezone,
        dateFormat: updatedTenant.dateFormat
      }
    })
  } catch (error: any) {
    console.error('Error updating company settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}
