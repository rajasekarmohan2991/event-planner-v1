import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const registerProviderSchema = z.object({
  providerType: z.enum(['VENDOR', 'SPONSOR', 'EXHIBITOR']),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  description: z.string().optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  categories: z.array(z.object({
    category: z.string(),
    subcategory: z.string().optional(),
    isPrimary: z.boolean().optional()
  })).min(1, 'At least one category is required')
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = registerProviderSchema.parse(body)

    // Check if provider with this email already exists
    const existingProvider = await prisma.$queryRaw<any[]>`
      SELECT id FROM service_providers WHERE email = ${validatedData.email}
    `

    if (existingProvider.length > 0) {
      return NextResponse.json(
        { error: 'A provider with this email already exists' },
        { status: 400 }
      )
    }

    // Create the service provider
    const providerResult = await prisma.$queryRaw<any[]>`
      INSERT INTO service_providers (
        provider_type, company_name, email, phone, website,
        city, state, country, description, year_established,
        verification_status, is_active, created_at, updated_at
      ) VALUES (
        ${validatedData.providerType},
        ${validatedData.companyName},
        ${validatedData.email},
        ${validatedData.phone || null},
        ${validatedData.website || null},
        ${validatedData.city || null},
        ${validatedData.state || null},
        ${validatedData.country},
        ${validatedData.description || null},
        ${validatedData.yearEstablished || null},
        'PENDING',
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const providerId = providerResult[0]?.id

    if (!providerId) {
      throw new Error('Failed to create provider')
    }

    // Add categories
    for (const category of validatedData.categories) {
      await prisma.$executeRaw`
        INSERT INTO provider_categories (
          provider_id, category, subcategory, is_primary, created_at
        ) VALUES (
          ${providerId}::bigint,
          ${category.category},
          ${category.subcategory || null},
          ${category.isPrimary || false},
          NOW()
        )
      `
    }

    // Link the current user as the owner
    const userId = BigInt(session.user.id)
    await prisma.$executeRaw`
      INSERT INTO provider_users (
        provider_id, user_id, role, is_active, invited_at, joined_at
      ) VALUES (
        ${providerId}::bigint,
        ${userId}::bigint,
        'OWNER',
        true,
        NOW(),
        NOW()
      )
    `

    // Fetch the created provider with categories
    const provider = await prisma.$queryRaw<any[]>`
      SELECT 
        sp.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pc.id,
              'category', pc.category,
              'subcategory', pc.subcategory,
              'isPrimary', pc.is_primary
            )
          ) FILTER (WHERE pc.id IS NOT NULL),
          '[]'
        ) as categories
      FROM service_providers sp
      LEFT JOIN provider_categories pc ON pc.provider_id = sp.id
      WHERE sp.id = ${providerId}::bigint
      GROUP BY sp.id
    `

    return NextResponse.json({
      success: true,
      provider: provider[0],
      message: 'Provider registered successfully. Your account is pending verification.'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Provider registration error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to register provider',
      details: error.message
    }, { status: 500 })
  }
}
