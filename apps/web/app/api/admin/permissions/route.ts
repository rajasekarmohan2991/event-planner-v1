import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// Define all available permissions
const AVAILABLE_PERMISSIONS = {
  // User Management
  'users.view': 'View users',
  'users.create': 'Create users', 
  'users.edit': 'Edit users',
  'users.delete': 'Delete users',
  'users.assign_roles': 'Assign roles to users',
  
  // Event Management
  'events.view': 'View events',
  'events.create': 'Create events',
  'events.edit': 'Edit events', 
  'events.delete': 'Delete events',
  'events.publish': 'Publish events',
  'events.manage_registrations': 'Manage registrations',
  
  // Role Management
  'roles.view': 'View roles',
  'roles.create': 'Create roles',
  'roles.edit': 'Edit roles',
  'roles.delete': 'Delete roles',
  'roles.assign_permissions': 'Assign permissions to roles',
  
  // Analytics & Reports
  'analytics.view': 'View analytics',
  'analytics.export': 'Export reports',
  'analytics.payments': 'View payment analytics',
  
  // System Settings
  'system.settings': 'Manage system settings',
  'system.backup': 'Backup system data',
  'system.maintenance': 'System maintenance mode',
  
  // Payment Management
  'payments.view': 'View payments',
  'payments.process': 'Process payments',
  'payments.refund': 'Process refunds',
  'payments.settings': 'Manage payment settings',
  
  // Communication
  'communication.send_email': 'Send emails',
  'communication.send_sms': 'Send SMS',
  'communication.bulk_operations': 'Bulk operations',
  
  // Design & Branding
  'design.templates': 'Manage templates',
  'design.branding': 'Manage branding',
  'design.themes': 'Manage themes',
  
  // Promo Codes
  'promo_codes.view': 'View promo codes',
  'promo_codes.create': 'Create promo codes',
  'promo_codes.edit': 'Edit promo codes',
  'promo_codes.delete': 'Delete promo codes',
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    
    const role = String(((session as any).user?.role) || '')
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Only SUPER_ADMIN can manage permissions' }, { status: 403 })
    }

    // Get all roles with their permissions
    const roles = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.is_system as "isSystem",
        r.created_at as "createdAt",
        COALESCE(
          array_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL),
          ARRAY[]::text[]
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.description, r.is_system, r.created_at
      ORDER BY r.is_system DESC, r.name ASC
    `

    return NextResponse.json({
      roles: roles || [],
      availablePermissions: AVAILABLE_PERMISSIONS
    })

  } catch (error: any) {
    console.error('Permissions fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    
    const role = String(((session as any).user?.role) || '')
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Only SUPER_ADMIN can manage permissions' }, { status: 403 })
    }

    const { action, roleId, permissions, userId, newRoleName, newRoleDescription } = await req.json()

    switch (action) {
      case 'assign_permissions':
        // Clear existing permissions for role
        await prisma.$executeRaw`DELETE FROM role_permissions WHERE role_id = ${roleId}`
        
        // Add new permissions
        if (permissions && permissions.length > 0) {
          for (const permission of permissions) {
            await prisma.$executeRaw`
              INSERT INTO role_permissions (role_id, permission_key, created_at)
              VALUES (${roleId}, ${permission}, NOW())
            `
          }
        }
        
        return NextResponse.json({ success: true, message: 'Permissions updated successfully' })

      case 'assign_role_to_user':
        await prisma.$executeRaw`
          UPDATE users 
          SET role = ${roleId}, updated_at = NOW()
          WHERE id = ${userId}
        `
        
        return NextResponse.json({ success: true, message: 'Role assigned to user successfully' })

      case 'create_role':
        const newRole = await prisma.$queryRaw`
          INSERT INTO roles (name, description, is_system, created_at)
          VALUES (${newRoleName}, ${newRoleDescription}, false, NOW())
          RETURNING id, name, description, is_system as "isSystem", created_at as "createdAt"
        `
        
        return NextResponse.json({ success: true, role: (newRole as any)[0] })

      case 'delete_role':
        // Check if role is system role
        const roleCheck = await prisma.$queryRaw`
          SELECT is_system FROM roles WHERE id = ${roleId}
        `
        
        if ((roleCheck as any)[0]?.is_system) {
          return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 })
        }
        
        // Delete role permissions first
        await prisma.$executeRaw`DELETE FROM role_permissions WHERE role_id = ${roleId}`
        
        // Delete role
        await prisma.$executeRaw`DELETE FROM roles WHERE id = ${roleId}`
        
        return NextResponse.json({ success: true, message: 'Role deleted successfully' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Permissions management error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
