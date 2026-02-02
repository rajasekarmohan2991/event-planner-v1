import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FinanceMigrationService } from '@/lib/services/finance-migration.service'

export const dynamic = 'force-dynamic'

// GET - List tenant's tax configurations
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    // Get tenant's finance mode
    const financeMode = await FinanceMigrationService.getFinanceMode(tenantId)

    if (financeMode === 'legacy') {
      // Return global templates only (read-only)
      const templates = await prisma.$queryRaw<any[]>`
        SELECT * FROM global_tax_templates 
        WHERE is_active = true
        ORDER BY name
      `

      return NextResponse.json({
        taxes: templates.map(t => ({
          id: t.id,
          name: t.name,
          rate: t.rate,
          description: t.description,
          taxType: t.tax_type,
          countryCode: t.country_code,
          isGlobal: true,
          isEditable: false
        })),
        mode: 'legacy',
        editable: false
      })
    }

    // Return tenant's tax structures
    const taxes = await prisma.$queryRaw<any[]>`
      SELECT 
        ts.*,
        gtt.name as global_template_name,
        gtt.rate as global_template_rate
      FROM tax_structures ts
      LEFT JOIN global_tax_templates gtt ON ts.global_template_id = gtt.id
      WHERE ts.tenant_id = ${tenantId}
      AND ts.is_active = true
      ORDER BY ts.is_default DESC, ts.name
    `

    // Also get available global templates for adoption
    const globalTemplates = await prisma.$queryRaw<any[]>`
      SELECT * FROM global_tax_templates 
      WHERE is_active = true
      ORDER BY name
    `

    return NextResponse.json({
      taxes: taxes.map(t => ({
        id: t.id,
        name: t.name,
        rate: t.rate,
        description: t.description,
        taxType: t.tax_type,
        countryCode: t.country_code,
        isDefault: t.is_default,
        isCustom: t.is_custom,
        isCompound: t.is_compound,
        globalTemplateId: t.global_template_id,
        globalTemplateName: t.global_template_name,
        effectiveFrom: t.effective_from,
        effectiveUntil: t.effective_until,
        isEditable: true
      })),
      globalTemplates: globalTemplates.map(t => ({
        id: t.id,
        name: t.name,
        rate: t.rate,
        description: t.description,
        taxType: t.tax_type,
        countryCode: t.country_code
      })),
      mode: 'tenant',
      editable: true
    })
  } catch (error: any) {
    console.error('Error fetching taxes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create custom tenant tax
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    // Check finance mode
    const financeMode = await FinanceMigrationService.getFinanceMode(tenantId)

    if (financeMode !== 'tenant') {
      return NextResponse.json(
        { error: 'Tenant must enable Advanced Finance mode first' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      name,
      rate,
      description,
      taxType,
      countryCode,
      isDefault,
      isCompound,
      globalTemplateId,
      effectiveFrom,
      effectiveUntil
    } = body

    if (!name || rate === undefined) {
      return NextResponse.json({ error: 'Name and rate are required' }, { status: 400 })
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.$executeRaw`
        UPDATE tax_structures 
        SET is_default = false, updated_at = NOW()
        WHERE tenant_id = ${tenantId}
      `
    }

    // Create custom tax
    const taxId = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await prisma.$executeRaw`
      INSERT INTO tax_structures (
        id, tenant_id, name, rate, description, tax_type, country_code,
        is_default, is_custom, is_compound, is_active, global_template_id,
        effective_from, effective_until, created_at, updated_at
      ) VALUES (
        ${taxId},
        ${tenantId},
        ${name},
        ${rate},
        ${description || null},
        ${taxType || 'CUSTOM'},
        ${countryCode || null},
        ${isDefault || false},
        ${!globalTemplateId},
        ${isCompound || false},
        true,
        ${globalTemplateId || null},
        ${effectiveFrom ? new Date(effectiveFrom) : null},
        ${effectiveUntil ? new Date(effectiveUntil) : null},
        NOW(),
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      tax: {
        id: taxId,
        name,
        rate,
        description,
        taxType: taxType || 'CUSTOM',
        isDefault: isDefault || false,
        isCustom: !globalTemplateId
      }
    })
  } catch (error: any) {
    console.error('Error creating tax:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
