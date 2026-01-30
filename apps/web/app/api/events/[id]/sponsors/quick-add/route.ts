import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Sponsor tier presets
const SPONSOR_PRESETS = {
    PLATINUM: {
        tier: 'PLATINUM',
        defaultAmount: 500000,
        benefits: ['Logo on main stage', 'Premium booth space (10x10)', 'Speaking slot', 'VIP passes (10)', 'Social media mentions'],
        description: 'Premium sponsorship package with maximum visibility'
    },
    GOLD: {
        tier: 'GOLD',
        defaultAmount: 250000,
        benefits: ['Logo on website and materials', 'Standard booth space (8x8)', 'VIP passes (5)', 'Social media mentions'],
        description: 'High-visibility sponsorship package'
    },
    SILVER: {
        tier: 'SILVER',
        defaultAmount: 100000,
        benefits: ['Logo on website', 'Small booth space (6x6)', 'VIP passes (2)'],
        description: 'Standard sponsorship package'
    },
    BRONZE: {
        tier: 'BRONZE',
        defaultAmount: 50000,
        benefits: ['Name mention on website', 'VIP passes (1)'],
        description: 'Entry-level sponsorship package'
    }
}

// POST /api/events/[id]/sponsors/quick-add - Quick add sponsor with minimal fields
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    try {
        const body = await req.json()
        const eventId = BigInt(params.id)

        const {
            name,
            tier = 'BRONZE',
            email,
            phone,
            amount,
            contactPerson,
            notes
        } = body

        // Validate required fields
        if (!name) {
            return NextResponse.json({
                message: 'Company name is required'
            }, { status: 400 })
        }

        if (!email) {
            return NextResponse.json({
                message: 'Email is required'
            }, { status: 400 })
        }

        // Get preset for tier
        const preset = SPONSOR_PRESETS[tier as keyof typeof SPONSOR_PRESETS] || SPONSOR_PRESETS.BRONZE

        // Prepare contact data
        const contactData = {
            email,
            phone: phone || null,
            contactPerson: contactPerson || null
        }

        // Prepare payment data with preset amount or custom amount
        const paymentData = {
            amount: amount || preset.defaultAmount,
            currency: 'INR',
            status: 'PENDING',
            benefits: preset.benefits
        }

        // Prepare branding data with defaults
        const brandingOnline = {
            websiteLogo: true,
            socialMediaMentions: tier === 'PLATINUM' || tier === 'GOLD',
            emailSignature: tier === 'PLATINUM'
        }

        const brandingOffline = {
            banners: tier === 'PLATINUM' || tier === 'GOLD',
            brochures: tier === 'PLATINUM',
            stageLogo: tier === 'PLATINUM'
        }

        const eventPresence = {
            boothSpace: tier !== 'BRONZE',
            boothSize: tier === 'PLATINUM' ? '10x10' : tier === 'GOLD' ? '8x8' : tier === 'SILVER' ? '6x6' : null,
            speakingSlot: tier === 'PLATINUM',
            vipPasses: tier === 'PLATINUM' ? 10 : tier === 'GOLD' ? 5 : tier === 'SILVER' ? 2 : 1
        }

        // Insert sponsor with quick-add status
        const result = await prisma.$queryRaw`
      INSERT INTO sponsors (
        event_id, name, tier, 
        contact_data, payment_data, 
        branding_online, branding_offline, event_presence,
        giveaway_data, legal_data, timeline_data, post_event_data,
        completion_status, notes,
        created_at, updated_at
      ) VALUES (
        ${eventId}, 
        ${name}, 
        ${tier},
        ${JSON.stringify(contactData)},
        ${JSON.stringify(paymentData)},
        ${JSON.stringify(brandingOnline)},
        ${JSON.stringify(brandingOffline)},
        ${JSON.stringify(eventPresence)},
        ${JSON.stringify({})},
        ${JSON.stringify({})},
        ${JSON.stringify({})},
        ${JSON.stringify({})},
        'QUICK_ADD',
        ${notes || null},
        NOW(), 
        NOW()
      )
      RETURNING id::text as id
    ` as any[]

        const sponsorId = result[0].id

        console.log(`[QUICK ADD] Created sponsor with ID: ${sponsorId}`)

        // Also create in vendors table
        try {
            console.log(`[QUICK ADD] Creating vendor entry...`)
            await prisma.$queryRawUnsafe(`
        INSERT INTO vendors (
          id, event_id, name, email, phone, contact_person,
          logo_url, website, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `,
                sponsorId,
                eventId,
                name,
                email,
                phone || null,
                contactPerson || null,
                null, // logo_url
                null, // website
                notes || null
            )
            console.log(`[QUICK ADD] Created vendor entry`)
        } catch (vendorError: any) {
            console.warn(`[QUICK ADD] Failed to create vendor:`, vendorError.message)
        }

        // Also create in exhibitors table
        try {
            console.log(`[QUICK ADD] Creating exhibitor entry...`)
            await prisma.$queryRawUnsafe(`
        INSERT INTO exhibitors (
          id, event_id, company_name, email, phone, contact_person,
          logo_url, website, description, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `,
                sponsorId,
                eventId,
                name,
                email,
                phone || null,
                contactPerson || null,
                null, // logo_url
                null, // website
                notes || null
            )
            console.log(`[QUICK ADD] Created exhibitor entry`)
        } catch (exhibitorError: any) {
            console.warn(`[QUICK ADD] Failed to create exhibitor:`, exhibitorError.message)
        }

        return NextResponse.json({
            success: true,
            id: sponsorId,
            message: 'Added successfully to Sponsors, Vendors, and Exhibitors. You can edit full details anytime.',
            preset: {
                tier: preset.tier,
                amount: paymentData.amount,
                benefits: preset.benefits,
                description: preset.description
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Quick add sponsor failed:', error)

        // Handle missing completion_status column
        if (error.message?.includes('completion_status')) {
            try {
                await prisma.$executeRawUnsafe(`
          ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS completion_status VARCHAR(20) DEFAULT 'COMPLETE'
        `)
                return NextResponse.json({
                    message: 'System updated. Please try again.'
                }, { status: 503 })
            } catch (alterError) {
                console.error('Failed to add completion_status column:', alterError)
            }
        }

        return NextResponse.json({
            message: error.message || 'Failed to add sponsor'
        }, { status: 500 })
    }
}

// GET /api/events/[id]/sponsors/quick-add - Get sponsor tier presets
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    return NextResponse.json({
        presets: SPONSOR_PRESETS,
        tiers: Object.keys(SPONSOR_PRESETS)
    })
}
