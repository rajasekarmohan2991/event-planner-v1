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
    const userId = (session as any).user.id

    // If no tenant ID, try resolving by role/membership/defaults
    if (!tenantId) {
      // SUPER_ADMIN global view: try well-known id, else fall through
      // SUPER_ADMIN global view: resolve by slug 'super-admin'
      if ((session as any).user.role === 'SUPER_ADMIN') {
        const adminTenants: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM tenants WHERE slug = 'super-admin' LIMIT 1`);
        if (adminTenants.length > 0) {
          tenantId = adminTenants[0].id;
        }
      }

      // If still missing, resolve via membership using raw SQL
      if (!tenantId && userId) {
        try {
          const memberships: any[] = await prisma.$queryRawUnsafe(`
            SELECT tenant_id as "tenantId" FROM tenant_members WHERE user_id = $1 LIMIT 1
          `, BigInt(userId))
          if (memberships.length > 0) {
            tenantId = memberships[0].tenantId
          }
        } catch (e) {
          console.log('Could not find membership, trying fallback')
        }
      }

      // If still missing, pick the first tenant in the system as a safe fallback
      if (!tenantId) {
        const tenants: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM tenants LIMIT 1`)
        if (tenants.length > 0) {
          tenantId = tenants[0].id
        }
      }
    }

    if (!tenantId) {
      return NextResponse.json({ message: 'No tenant found' }, { status: 404 })
    }

    // Use raw SQL to fetch tenant - only select columns that definitely exist
    let tenant: any
    let supportedCurrencies: string[] = []

    try {
      const tenants: any[] = await prisma.$queryRawUnsafe(`
        SELECT id, name, currency FROM tenants WHERE id = $1
      `, tenantId)

      if (tenants.length === 0) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
      }

      tenant = tenants[0]

      // Try to fetch metadata if column exists
      try {
        const metadataResult: any[] = await prisma.$queryRawUnsafe(`
          SELECT metadata FROM tenants WHERE id = $1
        `, tenantId)
        
        if (metadataResult.length > 0 && metadataResult[0].metadata) {
          const metadata = typeof metadataResult[0].metadata === 'string' 
            ? JSON.parse(metadataResult[0].metadata) 
            : metadataResult[0].metadata
          supportedCurrencies = metadata.supportedCurrencies || []
        }
      } catch (metadataError: any) {
        console.log('⚠️ Metadata column not available, using defaults')
      }
    } catch (error: any) {
      console.error('Error fetching tenant:', error)
      throw error
    }

    return NextResponse.json({
      currency: tenant.currency || 'USD',
      supportedCurrencies
    })
  } catch (error: any) {
    console.error('Error fetching tenant settings:', error)
    console.error('Stack:', error.stack)
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
    const userId = (session as any).user.id

    // If no tenant ID, try resolving by role/membership/defaults
    if (!tenantId) {
      if ((session as any).user.role === 'SUPER_ADMIN') {
        const adminTenants: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM tenants WHERE slug = 'super-admin' LIMIT 1`);
        if (adminTenants.length > 0) {
          tenantId = adminTenants[0].id;
        }
      }
      if (!tenantId && userId) {
        try {
          const memberships: any[] = await prisma.$queryRawUnsafe(`
            SELECT tenant_id as "tenantId" FROM tenant_members WHERE user_id = $1 LIMIT 1
          `, BigInt(userId))
          if (memberships.length > 0) {
            tenantId = memberships[0].tenantId
          }
        } catch (e) {
          console.log('Could not find membership')
        }
      }
      if (!tenantId) {
        const tenants: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM tenants LIMIT 1`)
        if (tenants.length > 0) {
          tenantId = tenants[0].id
        }
      }
    }

    if (!tenantId) {
      return NextResponse.json({ message: 'No tenant found' }, { status: 404 })
    }

    const body = await req.json()
    const { supportedCurrencies, defaultCurrency } = body

    // Fetch current tenant using raw SQL
    const tenants: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, currency FROM tenants WHERE id = $1
    `, tenantId)

    if (tenants.length === 0) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    const tenant = tenants[0]
    const finalCurrency = defaultCurrency || tenant.currency || 'USD'

    // Try to update with metadata if column exists, otherwise just update currency
    try {
      // First try to get existing metadata
      let existingMetadata: any = {}
      try {
        const metadataResult: any[] = await prisma.$queryRawUnsafe(`
          SELECT metadata FROM tenants WHERE id = $1
        `, tenantId)
        if (metadataResult.length > 0 && metadataResult[0].metadata) {
          existingMetadata = typeof metadataResult[0].metadata === 'string'
            ? JSON.parse(metadataResult[0].metadata)
            : metadataResult[0].metadata
        }
      } catch (e) {
        console.log('⚠️ Metadata column not available')
      }

      const newMetadata = {
        ...existingMetadata,
        supportedCurrencies: supportedCurrencies || existingMetadata.supportedCurrencies || []
      }

      // Try to update with metadata
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE tenants SET currency = $1, metadata = $2, updated_at = NOW() WHERE id = $3
        `, finalCurrency, JSON.stringify(newMetadata), tenantId)
      } catch (metadataUpdateError: any) {
        // Fallback: just update currency if metadata column doesn't exist
        console.log('⚠️ Updating without metadata column')
        await prisma.$executeRawUnsafe(`
          UPDATE tenants SET currency = $1, updated_at = NOW() WHERE id = $2
        `, finalCurrency, tenantId)
      }
    } catch (error: any) {
      console.error('Error updating tenant:', error)
      throw error
    }

    return NextResponse.json({
      message: 'Settings updated',
      currency: finalCurrency,
      supportedCurrencies: supportedCurrencies || []
    })
  } catch (error: any) {
    console.error('Error updating tenant settings:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
