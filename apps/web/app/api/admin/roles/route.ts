import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Mock roles data (you can replace with database storage later)
let systemRoles = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [
      'manage_users',
      'manage_events', 
      'manage_organizations',
      'manage_system_settings',
      'view_analytics',
      'manage_roles',
      'delete_events',
      'manage_payments',
      'access_admin_panel'
    ],
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ADMIN',
    name: 'Admin',
    description: 'Tenant admin access with most permissions',
    permissions: [
      'manage_events',
      'manage_organizations', 
      'view_analytics',
      'manage_payments',
      'access_admin_panel'
    ],
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EVENT_MANAGER',
    name: 'Event Manager',
    description: 'Can create and manage events',
    permissions: [
      'manage_events',
      'view_analytics',
      'manage_registrations'
    ],
    isSystem: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'USER',
    name: 'User',
    description: 'Regular user access for event registration',
    permissions: [
      'register_events',
      'view_events'
    ],
    isSystem: true,
    createdAt: new Date().toISOString()
  }
]

const availablePermissions = [
  { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, delete users' },
  { id: 'manage_events', name: 'Manage Events', description: 'Create, edit, delete events' },
  { id: 'manage_organizations', name: 'Manage Organizations', description: 'Manage organization settings' },
  { id: 'manage_system_settings', name: 'Manage System Settings', description: 'Access system configuration' },
  { id: 'view_analytics', name: 'View Analytics', description: 'Access reports and analytics' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create and edit user roles' },
  { id: 'delete_events', name: 'Delete Events', description: 'Permission to delete events' },
  { id: 'manage_payments', name: 'Manage Payments', description: 'Handle payment processing' },
  { id: 'access_admin_panel', name: 'Access Admin Panel', description: 'Access admin dashboard' },
  { id: 'manage_registrations', name: 'Manage Registrations', description: 'Handle event registrations' },
  { id: 'register_events', name: 'Register for Events', description: 'Register for events' },
  { id: 'view_events', name: 'View Events', description: 'View public events' }
]

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  
  const role = String(((session as any).user?.role) || '')
  if (!['SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const includePermissions = searchParams.get('includePermissions') === 'true'

  const response: any = { roles: systemRoles }
  if (includePermissions) {
    response.availablePermissions = availablePermissions
  }

  return NextResponse.json(response)
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  
  const role = String(((session as any).user?.role) || '')
  if (!['SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, description, permissions } = await req.json()
    
    if (!name || !description || !Array.isArray(permissions)) {
      return NextResponse.json({ message: 'Invalid role data' }, { status: 400 })
    }

    const roleId = name.toUpperCase().replace(/\s+/g, '_')
    
    // Check if role already exists
    if (systemRoles.find(r => r.id === roleId)) {
      return NextResponse.json({ message: 'Role already exists' }, { status: 400 })
    }

    const newRole = {
      id: roleId,
      name,
      description,
      permissions,
      isSystem: false,
      createdAt: new Date().toISOString()
    }

    systemRoles.push(newRole)

    return NextResponse.json(newRole, { status: 201 })
  } catch (error: any) {
    console.error('Error creating role:', error)
    return NextResponse.json({ message: error?.message || 'Failed to create role' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  
  const role = String(((session as any).user?.role) || '')
  if (!['SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id, name, description, permissions } = await req.json()
    
    const roleIndex = systemRoles.findIndex(r => r.id === id)
    if (roleIndex === -1) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 })
    }

    const existingRole = systemRoles[roleIndex]
    if (existingRole.isSystem && id !== 'EVENT_MANAGER') {
      return NextResponse.json({ message: 'Cannot modify system roles' }, { status: 400 })
    }

    systemRoles[roleIndex] = {
      ...existingRole,
      name: name || existingRole.name,
      description: description || existingRole.description,
      permissions: permissions || existingRole.permissions
    }

    return NextResponse.json(systemRoles[roleIndex])
  } catch (error: any) {
    console.error('Error updating role:', error)
    return NextResponse.json({ message: error?.message || 'Failed to update role' }, { status: 500 })
  }
}
