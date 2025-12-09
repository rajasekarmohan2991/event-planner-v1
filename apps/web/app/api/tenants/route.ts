import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List user's tenants
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.tenantMember.findMany({
      where: {
        userId: BigInt(session.user.id)
      },
      include: {
        tenant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const tenants = memberships.map((m: any) => ({
      ...m.tenant,
      role: m.role,
      joinedAt: m.createdAt
    }))

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Get tenants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

// POST - Create new tenant
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug } = await req.json()

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.tenant.findFirst({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 409 }
      )
    }

    // Create tenant - default FREE plan, TRIAL 30 days
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        subdomain: slug, // Use slug as subdomain
        plan: 'FREE',
        status: 'TRIAL',
        trialEndsAt,
        members: {
          create: {
            userId: BigInt(session.user.id),
            role: 'TENANT_ADMIN'
          }
        }
      }
    })

    // Set as user's current tenant
    await prisma.user.update({
      where: { id: BigInt(session.user.id) },
      data: { currentTenantId: tenant.id }
    })

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    console.error('Create tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
