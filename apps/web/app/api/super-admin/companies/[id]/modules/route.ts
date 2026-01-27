import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const updateModulesSchema = z.object({
  moduleVendorManagement: z.boolean().optional(),
  moduleSponsorManagement: z.boolean().optional(),
  moduleExhibitorManagement: z.boolean().optional(),
  providerCommissionRate: z.number().min(0).max(100).optional()
})

// GET - Get company module settings
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    const tenant = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        name,
        subscription_plan,
        module_vendor_management,
        module_sponsor_management,
        module_exhibitor_management,
        provider_commission_rate,
        provider_settings
      FROM tenants 
      WHERE id = ${tenantId}
    `

    if (!tenant[0]) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get provider statistics
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE provider_type = 'VENDOR') as vendor_count,
        COUNT(*) FILTER (WHERE provider_type = 'SPONSOR') as sponsor_count,
        COUNT(*) FILTER (WHERE provider_type = 'EXHIBITOR') as exhibitor_count,
        COUNT(*) FILTER (WHERE verification_status = 'VERIFIED') as verified_count,
        COUNT(*) FILTER (WHERE verification_status = 'PENDING') as pending_count,
        SUM(total_revenue) as total_revenue
      FROM service_providers
      WHERE tenant_id = ${tenantId}
    `

    return NextResponse.json({
      company: tenant[0],
      statistics: stats[0] || {
        vendor_count: 0,
        sponsor_count: 0,
        exhibitor_count: 0,
        verified_count: 0,
        pending_count: 0,
        total_revenue: 0
      }
    })

  } catch (error: any) {
    console.error('Error fetching company modules:', error)
    return NextResponse.json({
      error: 'Failed to fetch company modules',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update company module settings
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id
    const body = await req.json()
    const validatedData = updateModulesSchema.parse(body)

    // Check if company exists using Prisma Client for robustness
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Build update query dynamically
    // Using snake_case for raw SQL as these columns are likely manually added or mapped in DB
    const updates: string[] = []
    const values: any[] = []

    if (validatedData.moduleVendorManagement !== undefined) {
      updates.push(`module_vendor_management = $${updates.length + 1}`)
      values.push(validatedData.moduleVendorManagement)
    }

    if (validatedData.moduleSponsorManagement !== undefined) {
      updates.push(`module_sponsor_management = $${updates.length + 1}`)
      values.push(validatedData.moduleSponsorManagement)
    }

    if (validatedData.moduleExhibitorManagement !== undefined) {
      updates.push(`module_exhibitor_management = $${updates.length + 1}`)
      values.push(validatedData.moduleExhibitorManagement)
    }

    if (validatedData.providerCommissionRate !== undefined) {
      updates.push(`provider_commission_rate = $${updates.length + 1}`)
      values.push(validatedData.providerCommissionRate)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Add updated_at (try snake_case first as per other raw queries in this project)
    updates.push('updated_at = NOW()')

    // Execute update
    await prisma.$executeRawUnsafe(`
      UPDATE tenants
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
    `, ...values, tenantId).catch(async (e) => {
      // Fallback for updatedAt vs updated_at if needed, but usually it's updated_at in raw
      console.warn('Raw update failed, trying without updated_at...', e.message);
      const minimalUpdates = updates.filter(u => !u.includes('updated_at'));
      await prisma.$executeRawUnsafe(`
          UPDATE tenants
            SET ${minimalUpdates.join(', ')}
            WHERE id = $${values.length + 1}
        `, ...values, tenantId);
    });

    // Fetch updated tenant for response
    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    return NextResponse.json({
      success: true,
      company: updatedTenant,
      message: 'Company modules updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating company modules:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to update company modules',
      details: error.message
    }, { status: 500 })
  }
}
