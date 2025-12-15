import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    let tenantId = (session as any).user.currentTenantId as string | undefined
    
    // If no tenant ID, try resolving by role/membership/defaults
    if (!tenantId) {
      // SUPER_ADMIN global view: try well-known id, else fall through
      if ((session as any).user.role === 'SUPER_ADMIN') {
        tenantId = 'default-tenant'
      }
      
      // If still missing, resolve via membership
      if (!tenantId) {
        const membership = await prisma.tenantMember.findFirst({
          where: { userId: BigInt((session as any).user.id) },
          select: { tenantId: true }
        })
        tenantId = membership?.tenantId
      }
      
      // If still missing, pick the first tenant in the system as a safe fallback
      if (!tenantId) {
        const anyTenant = await prisma.tenant.findFirst({ select: { id: true } })
        tenantId = anyTenant?.id
      }
    }
    
    if (!tenantId) {
      return NextResponse.json({ message: 'No tenant found' }, { status: 404 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    // Extract supported currencies from metadata
    const metadata = (tenant.metadata as any) || {}
    const supportedCurrencies = metadata.supportedCurrencies || []

    return NextResponse.json({
      currency: tenant.currency,
      supportedCurrencies
    })
  } catch (error: any) {
    console.error('Error fetching tenant settings:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    let tenantId = (session as any).user.currentTenantId as string | undefined
    
    // If no tenant ID, try resolving by role/membership/defaults
    if (!tenantId) {
      if ((session as any).user.role === 'SUPER_ADMIN') {
        tenantId = 'default-tenant'
      }
      if (!tenantId) {
        const membership = await prisma.tenantMember.findFirst({
          where: { userId: BigInt((session as any).user.id) },
          select: { tenantId: true }
        })
        tenantId = membership?.tenantId
      }
      if (!tenantId) {
        const anyTenant = await prisma.tenant.findFirst({ select: { id: true } })
        tenantId = anyTenant?.id
      }
    }

    if (!tenantId) {
      return NextResponse.json({ message: 'No tenant found' }, { status: 404 })
    }

    const body = await req.json()
    const { supportedCurrencies, defaultCurrency } = body

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }})
    if (!tenant) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    const metadata = (tenant.metadata as any) || {}
    
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        currency: defaultCurrency || tenant.currency,
        metadata: {
          ...metadata,
          supportedCurrencies: supportedCurrencies || metadata.supportedCurrencies || []
        }
      }
    })

    return NextResponse.json({ 
      message: 'Settings updated',
      currency: updatedTenant.currency,
      supportedCurrencies: (updatedTenant.metadata as any).supportedCurrencies
    })
  } catch (error: any) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
