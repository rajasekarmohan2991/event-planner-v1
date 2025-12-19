import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

function parseIntSafe(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : d
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const currentTenantId = (session.user as any).currentTenantId

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({
        error: 'Access denied',
        message: 'Admin access required',
        userRole
      }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseIntSafe(searchParams.get('page'), 1)
    const limit = Math.min(parseIntSafe(searchParams.get('limit'), 20), 100)
    const q = (searchParams.get('q') || '').trim()
    const companyId = (searchParams.get('companyId') || '').trim()

    // Use raw SQL to avoid Prisma schema issues and handle BigInt
    // SUPER_ADMIN sees all users, ADMIN sees only their tenant's users
    const isSuperAdmin = userRole === 'SUPER_ADMIN'

    // Prepare promises for parallel execution
    let usersPromise
    let countPromise

    if (q) {
      if (isSuperAdmin) {
        if (companyId) {
          usersPromise = prisma.$queryRaw`
            SELECT 
              u.id::text as id,
              u.name,
              u.email,
              u.role,
              u.created_at as "createdAt",
              u.updated_at as "updatedAt",
              t.id as "companyId",
              t.name as "companyName",
              tm.role as "tenantRole",
              approver.id::text as "approverId",
              approver.name as "approverName",
              approver.email as "approverEmail"
            FROM users u
            INNER JOIN tenant_members tm ON u.id = tm."userId"
            INNER JOIN tenants t ON tm."tenantId" = t.id
            LEFT JOIN users approver ON tm."invitedBy" = approver.id
            WHERE tm."tenantId" = ${companyId}
              AND (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR u.role ILIKE ${`%${q}%`})
            ORDER BY u.created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `
          countPromise = prisma.$queryRaw`
            SELECT COUNT(*)::int as count 
            FROM users u
            INNER JOIN tenant_members tm ON u.id = tm."userId"
            WHERE tm."tenantId" = ${companyId}
              AND (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR u.role ILIKE ${`%${q}%`})
          `
        } else {
          usersPromise = prisma.$queryRaw`
            SELECT 
              u.id::text as id,
              u.name,
              u.email,
              u.role,
              u.created_at as "createdAt",
              u.updated_at as "updatedAt",
              t.id as "companyId",
              t.name as "companyName",
              tm.role as "tenantRole",
              approver.id::text as "approverId",
              approver.name as "approverName",
              approver.email as "approverEmail"
            FROM users u
            LEFT JOIN tenant_members tm ON u.id = tm."userId"
            LEFT JOIN tenants t ON tm."tenantId" = t.id
            LEFT JOIN users approver ON tm."invitedBy" = approver.id
            WHERE (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR u.role ILIKE ${`%${q}%`})
            ORDER BY u.created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `
          countPromise = prisma.$queryRaw`
            SELECT COUNT(*)::int as count 
            FROM users u
            WHERE (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR u.role ILIKE ${`%${q}%`})
          `
        }
      } else {
        // ADMIN: only show users from their tenant
        usersPromise = prisma.$queryRaw`
          SELECT 
            u.id::text as id,
            u.name,
            u.email,
            u.role,
            u.created_at as "createdAt",
            u.updated_at as "updatedAt",
            t.id as "companyId",
            t.name as "companyName",
            tm.role as "tenantRole",
            approver.id::text as "approverId",
            approver.name as "approverName",
            approver.email as "approverEmail"
          FROM users u
          INNER JOIN tenant_members tm ON u.id = tm."userId"
          INNER JOIN tenants t ON tm."tenantId" = t.id
          LEFT JOIN users approver ON tm."invitedBy" = approver.id
          WHERE tm."tenantId" = ${currentTenantId}
            AND (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR u.role ILIKE ${`%${q}%`})
          ORDER BY u.created_at DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `
        countPromise = prisma.$queryRaw`
          SELECT COUNT(*)::int as count 
          FROM users u
          INNER JOIN tenant_members tm ON u.id = tm."userId"
          WHERE tm."tenantId" = ${currentTenantId}
            AND (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR u.role ILIKE ${`%${q}%`})
        `
      }
    } else {
      if (isSuperAdmin) {
        if (companyId) {
          usersPromise = prisma.$queryRaw`
            SELECT 
              u.id::text as id,
              u.name,
              u.email,
              u.role,
              u.created_at as "createdAt",
              u.updated_at as "updatedAt",
              t.id as "companyId",
              t.name as "companyName",
              tm.role as "tenantRole",
              approver.id::text as "approverId",
              approver.name as "approverName",
              approver.email as "approverEmail"
            FROM users u
            INNER JOIN tenant_members tm ON u.id = tm."userId"
            INNER JOIN tenants t ON tm."tenantId" = t.id
            LEFT JOIN users approver ON tm."invitedBy" = approver.id
            WHERE tm."tenantId" = ${companyId}
            ORDER BY u.created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `
          countPromise = prisma.$queryRaw`
            SELECT COUNT(*)::int as count 
            FROM users u
            INNER JOIN tenant_members tm ON u.id = tm."userId"
            WHERE tm."tenantId" = ${companyId}
          `
        } else {
          usersPromise = prisma.$queryRaw`
            SELECT 
              u.id::text as id,
              u.name,
              u.email,
              u.role,
              u.created_at as "createdAt",
              u.updated_at as "updatedAt",
              t.id as "companyId",
              t.name as "companyName",
              tm.role as "tenantRole",
              approver.id::text as "approverId",
              approver.name as "approverName",
              approver.email as "approverEmail"
            FROM users u
            LEFT JOIN tenant_members tm ON u.id = tm."userId"
            LEFT JOIN tenants t ON tm."tenantId" = t.id
            LEFT JOIN users approver ON tm."invitedBy" = approver.id
            ORDER BY u.created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `
          countPromise = prisma.$queryRaw`
            SELECT COUNT(*)::int as count 
            FROM users u
          `
        }
      } else {
        // ADMIN: only show users from their tenant
        usersPromise = prisma.$queryRaw`
          SELECT 
            u.id::text as id,
            u.name,
            u.email,
            u.role,
            u.created_at as "createdAt",
            u.updated_at as "updatedAt",
            t.id as "companyId",
            t.name as "companyName",
            tm.role as "tenantRole",
            approver.id::text as "approverId",
            approver.name as "approverName",
            approver.email as "approverEmail"
          FROM users u
          INNER JOIN tenant_members tm ON u.id = tm."userId"
          INNER JOIN tenants t ON tm."tenantId" = t.id
          LEFT JOIN users approver ON tm."invitedBy" = approver.id
          WHERE tm."tenantId" = ${currentTenantId}
          ORDER BY u.created_at DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `
        countPromise = prisma.$queryRaw`
          SELECT COUNT(*)::int as count 
          FROM users u
          INNER JOIN tenant_members tm ON u.id = tm."userId"
          WHERE tm."tenantId" = ${currentTenantId}
        `
      }
    }

    // Execute in parallel
    const [users, totalResult] = await Promise.all([usersPromise, countPromise])


    // Transform the data to match the expected format
    const transformedUsers = (users as any[]).map(user => ({
      id: parseInt(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      company: user.companyId ? {
        id: user.companyId,
        name: user.companyName
      } : null,
      tenantRole: user.tenantRole,
      approvedBy: user.approverId ? {
        id: parseInt(user.approverId),
        name: user.approverName,
        email: user.approverEmail
      } : null
    }))

    const total = (totalResult as any)[0]?.count || 0

    return NextResponse.json({
      page,
      limit,
      total,
      users: transformedUsers,
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      error: 'Failed to fetch users',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const currentTenantId = (session.user as any).currentTenantId

    // Allow SUPER_ADMIN and ADMIN (company admin) to create users
    if (!['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'OWNER'].includes(userRole)) {
      return NextResponse.json({
        error: 'Access denied',
        message: 'Admin access required to create users'
      }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role, companyId } = body

    // Company admins can only create users for their own company
    const isSuperAdmin = userRole === 'SUPER_ADMIN'
    const targetTenantId = companyId || currentTenantId

    if (!isSuperAdmin && companyId && companyId !== currentTenantId) {
      return NextResponse.json({
        error: 'Access denied',
        message: 'You can only create users for your own company'
      }, { status: 403 })
    }

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name, email, password, and role are required'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if ((existingUser as any[]).length > 0) {
      return NextResponse.json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user using raw SQL to avoid BigInt issues
    const result = await prisma.$queryRaw`
      INSERT INTO users (name, email, password_hash, role, created_at, updated_at, current_tenant_id, email_verified)
      VALUES (
        ${name}, 
        ${email}, 
        ${hashedPassword}, 
        ${role}, 
        NOW(), 
        NOW(),
        ${companyId || process.env.DEFAULT_TENANT_ID || 'default-tenant'},
        NOW()
      )
      RETURNING id::text as id, name, email, role, created_at as "createdAt"
    `

    const newUser = (result as any[])[0]

    // Ensure membership in the specified company (if provided)
    // targetTenantId already defined above
    try {
      await prisma.$executeRaw`
        INSERT INTO tenant_members ("tenantId", "userId", role, status, "invitedAt", "joinedAt")
        VALUES (
          ${targetTenantId},
          ${BigInt(newUser.id)},
          ${role},
          'ACTIVE',
          NOW(),
          NOW()
        )
        ON CONFLICT ("tenantId", "userId") DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE'
      `
    } catch (e) {
      console.warn('Failed to create tenant membership for new user:', e)
    }

    // Log activity
    await logActivity({
      userId: (session as any).user.id,
      userName: (session as any).user.name,
      userEmail: (session as any).user.email,
      actionType: 'USER_CREATED',
      actionDescription: `Created new user: ${name} (${email}) with role ${role}`,
      entityType: 'USER',
      entityId: newUser.id,
      entityName: name,
      metadata: { role, email }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({
      error: 'Failed to create user',
      message: error.message
    }, { status: 500 })
  }
}
