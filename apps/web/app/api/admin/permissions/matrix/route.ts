import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Default permissions matrix based on your requirements
const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: {
    'users.view': true,
    'users.create': true,
    'users.edit': true,
    'users.delete': true,
    'events.view': true,
    'events.create': true,
    'events.edit': true,
    'events.delete': true,
    'admin.permissions': true,
    'analytics.view': true,
    'admin.system': true,
    'promo_codes.create': true,
    'payments.process': true,
    'communication.send_email': true
  },
  ADMIN: {
    'users.view': true,
    'users.create': false,
    'users.edit': false,
    'users.delete': false,
    'events.view': true,
    'events.create': true,
    'events.edit': true,
    'events.delete': false,
    'admin.permissions': false,
    'analytics.view': true,
    'admin.system': false,
    'promo_codes.create': true,
    'payments.process': false,
    'communication.send_email': true
  },
  EVENT_MANAGER: {
    'users.view': false,
    'users.create': false,
    'users.edit': false,
    'users.delete': false,
    'events.view': true,
    'events.create': true,
    'events.edit': true,
    'events.delete': false,
    'admin.permissions': false,
    'analytics.view': true,
    'admin.system': false,
    'promo_codes.create': true,
    'payments.process': false,
    'communication.send_email': true
  },
  ORGANIZER: {
    'users.view': false,
    'users.create': false,
    'users.edit': false,
    'users.delete': false,
    'events.view': true,
    'events.create': false,
    'events.edit': false,
    'events.delete': false,
    'admin.permissions': false,
    'analytics.view': false,
    'admin.system': false,
    'promo_codes.create': false,
    'payments.process': false,
    'communication.send_email': true
  },
  USER: {
    'users.view': false,
    'users.create': false,
    'users.edit': false,
    'users.delete': false,
    'events.view': true,
    'events.create': false,
    'events.edit': false,
    'events.delete': false,
    'admin.permissions': false,
    'analytics.view': false,
    'admin.system': false,
    'promo_codes.create': false,
    'payments.process': false,
    'communication.send_email': false
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Access denied',
        message: 'Only SUPER_ADMIN can view permissions matrix'
      }, { status: 403 })
    }

    // Try to get permissions from database, fallback to defaults
    try {
      const permissionsRecord = await prisma.$queryRaw`
        SELECT permissions_data 
        FROM system_permissions 
        WHERE id = 'module_access_matrix'
      `

      const permissions = (permissionsRecord as any[])[0]?.permissions_data || DEFAULT_PERMISSIONS

      return NextResponse.json({
        success: true,
        permissions
      })
    } catch (dbError) {
      // If table doesn't exist or query fails, return defaults
      return NextResponse.json({
        success: true,
        permissions: DEFAULT_PERMISSIONS
      })
    }

  } catch (error: any) {
    console.error('Error fetching permissions matrix:', error)
    return NextResponse.json({
      error: 'Failed to fetch permissions',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Access denied',
        message: 'Only SUPER_ADMIN can modify permissions matrix'
      }, { status: 403 })
    }

    const { permissions } = await req.json()

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json({
        error: 'Invalid permissions data'
      }, { status: 400 })
    }

    // Ensure SUPER_ADMIN always has access to everything
    const sanitizedPermissions = permissions.map(permission => ({
      ...permission,
      roles: {
        ...permission.roles,
        SUPER_ADMIN: true // Force SUPER_ADMIN to always have access
      }
    }))

    const userId = (session.user as any).id

    // Save to database (create table if it doesn't exist)
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS system_permissions (
          id VARCHAR(255) PRIMARY KEY,
          permissions_data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW(),
          updated_by BIGINT
        )
      `

      const permissionsJson = JSON.stringify(sanitizedPermissions)

      await prisma.$executeRaw`
        INSERT INTO system_permissions (id, permissions_data, updated_by)
        VALUES ('module_access_matrix', ${permissionsJson}, ${BigInt(userId)})
        ON CONFLICT (id) 
        DO UPDATE SET 
          permissions_data = ${permissionsJson},
          updated_at = NOW(),
          updated_by = ${BigInt(userId)}
      `

      return NextResponse.json({
        success: true,
        message: 'Permissions updated successfully',
        permissions: sanitizedPermissions
      })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        error: 'Failed to save permissions to database',
        details: dbError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error saving permissions matrix:', error)
    return NextResponse.json({
      error: 'Failed to save permissions',
      details: error.message
    }, { status: 500 })
  }
}
