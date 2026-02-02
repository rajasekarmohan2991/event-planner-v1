import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/module-access - Get all module access permissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).user.role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const permissions = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          id::text,
          module_name as "moduleName",
          role,
          can_view as "canView",
          can_create as "canCreate",
          can_edit as "canEdit",
          can_delete as "canDelete",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM module_access_matrix
        ORDER BY module_name, role
      `)

      return NextResponse.json({ permissions })
    } catch (dbError: any) {
      // If table doesn't exist, return empty array
      if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
        console.warn('module_access_matrix table does not exist, returning empty permissions')
        return NextResponse.json({ permissions: [] })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching module access:', error)
    return NextResponse.json({
      error: 'Failed to fetch module access',
      message: error.message
    }, { status: 500 })
  }
}

// POST /api/admin/module-access - Create or update module access permission
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).user.role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { moduleName, role, canView, canCreate, canEdit, canDelete } = body

    if (!moduleName || !role) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'moduleName and role are required'
      }, { status: 400 })
    }

    // Upsert permission
    await prisma.$executeRaw`
      INSERT INTO module_access_matrix (
        module_name, role, can_view, can_create, can_edit, can_delete, created_at, updated_at
      ) VALUES (
        ${moduleName},
        ${role},
        ${canView || false},
        ${canCreate || false},
        ${canEdit || false},
        ${canDelete || false},
        NOW(),
        NOW()
      )
      ON CONFLICT (module_name, role)
      DO UPDATE SET
        can_view = ${canView || false},
        can_create = ${canCreate || false},
        can_edit = ${canEdit || false},
        can_delete = ${canDelete || false},
        updated_at = NOW()
    `

    const updated = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id::text,
        module_name as "moduleName",
        role,
        can_view as "canView",
        can_create as "canCreate",
        can_edit as "canEdit",
        can_delete as "canDelete",
        updated_at as "updatedAt"
      FROM module_access_matrix
      WHERE module_name = $1 AND role = $2
    `, moduleName, role)

    return NextResponse.json(updated[0])
  } catch (error: any) {
    console.error('Error updating module access:', error)
    return NextResponse.json({
      error: 'Failed to update module access',
      message: error.message
    }, { status: 500 })
  }
}

// PUT /api/admin/module-access - Batch update permissions
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).user.role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { permissions } = body

    if (!Array.isArray(permissions)) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'permissions must be an array'
      }, { status: 400 })
    }

    // Update each permission
    for (const perm of permissions) {
      await prisma.$executeRaw`
        INSERT INTO module_access_matrix (
          module_name, role, can_view, can_create, can_edit, can_delete, created_at, updated_at
        ) VALUES (
          ${perm.moduleName},
          ${perm.role},
          ${perm.canView || false},
          ${perm.canCreate || false},
          ${perm.canEdit || false},
          ${perm.canDelete || false},
          NOW(),
          NOW()
        )
        ON CONFLICT (module_name, role)
        DO UPDATE SET
          can_view = ${perm.canView || false},
          can_create = ${perm.canCreate || false},
          can_edit = ${perm.canEdit || false},
          can_delete = ${perm.canDelete || false},
          updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true, updated: permissions.length })
  } catch (error: any) {
    console.error('Error batch updating module access:', error)
    return NextResponse.json({
      error: 'Failed to batch update module access',
      message: error.message
    }, { status: 500 })
  }
}
