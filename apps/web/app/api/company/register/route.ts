import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateCompanyEmail, isEmailAvailable } from '@/lib/email-validation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/register
 * 
 * Register a new company (tenant) with admin user
 * Creates:
 * 1. Tenant record
 * 2. Admin user (if doesn't exist)
 * 3. Tenant member with OWNER role
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      companyName,
      companyEmail,
      phone,
      industry,
      country,
      registrationNumber,
      address,
      adminName,
      adminEmail,
      password
    } = body

    // Validation
    if (!companyName || !companyEmail || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique slug from company name
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug already exists
    let slug = baseSlug
    let counter = 1
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Generate subdomain (same as slug)
    let subdomain = slug
    counter = 1
    while (await prisma.tenant.findUnique({ where: { subdomain } })) {
      subdomain = `${slug}-${counter}`
      counter++
    }

    // Validate company email
    const companyEmailValidation = await validateCompanyEmail(companyEmail)
    if (!companyEmailValidation.valid) {
      return NextResponse.json(
        { error: companyEmailValidation.error },
        { status: 409 }
      )
    }

    // Check if admin email is already used by a company (Tenant)
    // We allow existing Users (`usedBy: 'USER'`) to create companies, but not if the email is a company billing email
    const adminEmailAvailability = await isEmailAvailable(adminEmail)
    if (!adminEmailAvailability.available && adminEmailAvailability.usedBy === 'TENANT') {
      return NextResponse.json(
        { error: 'This admin email is already registered to another company' },
        { status: 409 }
      )
    }

    // Check if admin user exists (to determine if we create a new one or attach to existing)
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    // 2) If admin user already exists and is a member of any tenant, block duplicate company creation
    if (adminUser) {
      const membership = await prisma.tenantMember.findFirst({
        where: { userId: adminUser.id }
      })
      if (membership) {
        return NextResponse.json(
          { error: 'This admin email is already associated with a company' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if this is the first company
      const totalTenants = await tx.tenant.count()
      const isFirstCompany = totalTenants === 0

      const tenantPlan = isFirstCompany ? 'ENTERPRISE' : 'FREE'
      const userRole = isFirstCompany ? 'SUPER_ADMIN' : 'USER'

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: companyName,
          subdomain,
          status: 'TRIAL', // Start with trial status
          plan: tenantPlan,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          billingEmail: companyEmail,
          metadata: {
            phone,
            industry,
            country,
            registrationNumber,
            address,
            registeredAt: new Date().toISOString()
          }
        }
      })

      // Create or get admin user
      if (!adminUser) {
        adminUser = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: userRole,
            currentTenantId: tenant.id
          }
        })
      } else {
        // Prepare update data
        const updateData: any = {
          currentTenantId: tenant.id
        }

        // If this is the first company and user exists, upgrade them to SUPER_ADMIN
        if (isFirstCompany) {
          updateData.role = 'SUPER_ADMIN'
          adminUser.role = 'SUPER_ADMIN' // Update local object reference
        }

        // User exists but was not allowed to own multiple companies
        // For safety, still ensure currentTenantId is set if no membership exists
        const existingMembership = await tx.tenantMember.findFirst({ where: { userId: adminUser!.id } })
        if (!existingMembership) {
          await tx.user.update({
            where: { id: adminUser!.id },
            data: updateData
          })
        } else if (isFirstCompany) {
          // Even if membership exists (which shouldn't happen due to check above), upgrade role if needed
          await tx.user.update({
            where: { id: adminUser!.id },
            data: { role: 'SUPER_ADMIN' }
          })
        }
      }

      // Create tenant membership with OWNER role
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date()
        }
      })

      return { tenant, adminUser }
    })

    console.log(`✅ Company registered: ${companyName} (${slug})`)
    console.log(`✅ Admin user: ${adminEmail}`)

    return NextResponse.json({
      success: true,
      message: 'Company registered successfully',
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        status: result.tenant.status
      },
      admin: {
        id: result.adminUser.id.toString(),
        name: result.adminUser.name,
        email: result.adminUser.email
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error registering company:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Company with this name or email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register company', details: error.message },
      { status: 500 }
    )
  }
}
