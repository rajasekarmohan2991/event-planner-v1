import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ((session as any)?.user?.currentTenantId as string) || 'default-tenant'

    const tenant = await prisma.$queryRaw`
      SELECT id, name, slug, subdomain, logo, "primaryColor", "secondaryColor", 
             timezone, currency, "dateFormat", locale
      FROM tenants
      WHERE id = ${tenantId}
    `

    const tenantData = (tenant as any)[0]
    if (!tenantData) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ settings: tenantData })
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

    const tenantId = ((session as any)?.user?.currentTenantId as string) || 'default-tenant'
    const body = await req.json()

    await prisma.$queryRaw`
      UPDATE tenants
      SET 
        name = ${body.name},
        logo = ${body.logo},
        "primaryColor" = ${body.primaryColor},
        "secondaryColor" = ${body.secondaryColor},
        timezone = ${body.timezone},
        currency = ${body.currency},
        "dateFormat" = ${body.dateFormat},
        "updatedAt" = NOW()
      WHERE id = ${tenantId}
    `

    return NextResponse.json({ success: true, message: 'Settings updated' })
  } catch (error: any) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
