import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/login
 * 
 * Company-specific login
 * Validates user belongs to the specified tenant
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const { email, password, tenantSlug } = body
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // If tenant slug provided, verify membership
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      })
      
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
      
      // Check if user is member of this tenant
      const membership = await prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: user.id
          }
        }
      })
      
      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this organization' },
          { status: 403 }
        )
      }
      
      // Update user's current tenant
      await prisma.user.update({
        where: { id: user.id },
        data: { currentTenantId: tenant.id }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          subdomain: tenant.subdomain
        },
        membership: {
          role: membership.role,
          status: membership.status
        }
      })
    }
    
    // No tenant specified, return user's tenants
    const memberships = await prisma.tenantMember.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            subdomain: true,
            status: true,
            plan: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      tenants: memberships.map(m => ({
        ...m.tenant,
        memberRole: m.role,
        memberStatus: m.status
      }))
    })
    
  } catch (error: any) {
    console.error('Error during company login:', error)
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}
