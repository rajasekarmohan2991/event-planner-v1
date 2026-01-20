import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/admin/setup-tax-structures - Create tax structures table and populate defaults
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        // Only SUPER_ADMIN can run this
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔧 Setting up tax_structures table...')

        // Step 1: Create table
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS tax_structures (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        rate DECIMAL(5,2) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        is_custom BOOLEAN DEFAULT FALSE,
        global_template_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_tax_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `
        console.log('✅ Table created')

        // Step 2: Create indexes
        await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tax_structures_tenant ON tax_structures(tenant_id)
    `
        await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tax_structures_default ON tax_structures(tenant_id, is_default)
    `
        console.log('✅ Indexes created')

        // Step 3: Get all tenants
        const tenants = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM tenants
    `
        console.log(`📊 Found ${tenants.length} companies`)

        let created = 0

        // Step 4: Create default tax structures for each tenant
        for (const tenant of tenants) {
            const tenantId = tenant.id

            // Check if already has tax structures
            const existing = await prisma.$queryRaw<any[]>`
        SELECT id FROM tax_structures WHERE tenant_id = ${tenantId} LIMIT 1
      `

            if (existing.length > 0) {
                console.log(`⏭️  Skipping ${tenantId} - already has tax structures`)
                continue
            }

            // Create default GST structures
            const taxes = [
                { name: 'GST (18%)', rate: 18.00, description: 'Goods and Services Tax - Standard Rate', isDefault: true },
                { name: 'CGST (9%)', rate: 9.00, description: 'Central Goods and Services Tax', isDefault: false },
                { name: 'SGST (9%)', rate: 9.00, description: 'State Goods and Services Tax', isDefault: false },
                { name: 'GST (5%)', rate: 5.00, description: 'Goods and Services Tax - Reduced Rate', isDefault: false },
                { name: 'GST (12%)', rate: 12.00, description: 'Goods and Services Tax - Medium Rate', isDefault: false },
                { name: 'GST (28%)', rate: 28.00, description: 'Goods and Services Tax - Luxury Rate', isDefault: false },
                { name: 'No Tax', rate: 0.00, description: 'Tax Exempt / Zero Rated', isDefault: false },
            ]

            for (const tax of taxes) {
                const taxId = `tax_${tenantId}_${tax.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`

                await prisma.$executeRaw`
          INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
          VALUES (
            ${taxId},
            ${tenantId},
            ${tax.name},
            ${tax.rate},
            ${tax.description},
            ${tax.isDefault},
            FALSE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `
                created++
            }

            console.log(`✅ Created ${taxes.length} tax structures for ${tenantId}`)
        }

        return NextResponse.json({
            success: true,
            message: `Tax structures setup complete`,
            stats: {
                companies: tenants.length,
                taxStructuresCreated: created
            }
        })

    } catch (error: any) {
        console.error('❌ Error setting up tax structures:', error)
        return NextResponse.json({
            error: 'Failed to setup tax structures',
            details: error.message
        }, { status: 500 })
    }
}
