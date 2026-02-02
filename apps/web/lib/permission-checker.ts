import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole, Permission, getRoleDefinition, ROLE_DEFINITIONS, hasPermission as roleHasPermission } from './roles-config'

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  permissions?: Permission[]
}

// Define default permissions for roles (mirroring register route for fallback)
const ROLE_PERMISSIONS_FALLBACK: Record<string, any> = {
  'TENANT_ADMIN': {
    events: ['create', 'read', 'update', 'delete'],
    registrations: ['read', 'update', 'approve', 'checkin'],
    attendees: ['read', 'update', 'delete'],
    finance: ['read', 'manage'],
    settings: ['read', 'update'],
    team: ['read', 'invite', 'manage']
  }
}

/**
 * Get current user with their permissions from database
 */
export async function getCurrentUserWithPermissions(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session || !session.user) return null

    const user = session.user as any

    // Check for tenant context and get tenant-specific permissions
    if (user.currentTenantId) {
      let userIdBigInt: bigint
      try {
        userIdBigInt = BigInt(user.id)
      } catch (e) {
        console.error(`[Permission Check] Invalid user ID for BigInt: ${user.id}`, e)
        // Fallback to system role
        const userPermissions = await getUserPermissions(user.role)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: userPermissions
        }
      }

      const tenantMember = await prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId: user.currentTenantId,
            userId: userIdBigInt
          }
        },
        select: {
          role: true,
          permissions: true,
          status: true
        }
      })

      if (tenantMember && tenantMember.status === 'ACTIVE') {
        // Use tenant role and permissions
        // Ensure permissions are an array of strings
        let permissions: Permission[] = []
        // Normalize role names coming from DB (OWNER -> TENANT_ADMIN)
        const rawRole = String(tenantMember.role)
        const normalizedRole = rawRole === 'OWNER' ? 'TENANT_ADMIN' : rawRole

        // Check if permissions exist in DB
        if (Array.isArray(tenantMember.permissions)) {
          permissions = tenantMember.permissions as Permission[]
        } else if (typeof tenantMember.permissions === 'object' && tenantMember.permissions !== null) {
          const storedPerms = tenantMember.permissions as Record<string, string[]>
          Object.entries(storedPerms).forEach(([resource, actions]) => {
            if (Array.isArray(actions)) {
              actions.forEach(action => {
                const mapped = action === 'read' ? 'view' : action === 'update' ? 'edit' : action
                permissions.push(`${resource}.${mapped}` as Permission)
              })
            }
          })
        }

        // Fallback/Merge: For TENANT_ADMIN (incl. OWNER mapped), always ensure they have default permissions
        // This fixes issues where early accounts might have missing permission records
        if (normalizedRole === 'TENANT_ADMIN') {
          console.log(`[Permission Check] Ensuring default permissions for TENANT_ADMIN`)
          const defaultPerms = ROLE_PERMISSIONS_FALLBACK['TENANT_ADMIN']
          Object.entries(defaultPerms).forEach(([resource, actions]) => {
            if (Array.isArray(actions)) {
              actions.forEach(action => {
                const mapped = action === 'read' ? 'view' : action === 'update' ? 'edit' : action
                const permString = `${resource}.${mapped}` as Permission
                if (!permissions.includes(permString)) {
                  permissions.push(permString)
                }
              })
            }
          })
        }

        console.log(`[Permission Check] Using Tenant (${user.currentTenantId}) Role: ${normalizedRole}`)
        console.log(`[Permission Check] Permissions count: ${permissions.length}`)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: normalizedRole as UserRole,
          permissions: permissions
        }
      }
    }

    // Fallback: Get user's system role and permissions
    const userPermissions = await getUserPermissions(user.role)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: userPermissions
    }
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
}

/**
 * Get permissions for a specific role using role configuration
 */
export async function getUserPermissions(roleName: string): Promise<Permission[]> {
  try {
    // Use role configuration for system roles
    if (roleName in ROLE_DEFINITIONS) {
      const roleDefinition = getRoleDefinition(roleName as UserRole)
      console.log(`[Permission Check] Loading permissions for ${roleName}:`, roleDefinition.permissions)
      return roleDefinition.permissions
    }

    // Get permissions from database for custom roles
    console.log(`[Permission Check] ${roleName} not in ROLE_DEFINITIONS, checking database...`)
    const roleWithPermissions = await prisma.$queryRaw`
      SELECT 
        COALESCE(
          array_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL),
          ARRAY[]::text[]
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE r.name = ${roleName}
      GROUP BY r.id
    ` as any[]

    if (roleWithPermissions.length > 0) {
      return (roleWithPermissions[0].permissions || []) as Permission[]
    }

    console.log(`[Permission Check] No permissions found for ${roleName}`)
    return []
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return []
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUserWithPermissions()
  if (!user) return false

  // First, check explicit permissions loaded from DB/tenant context
  if (user.permissions?.includes(permission)) return true

  // Fallback: infer from role definition if explicit list is missing/incomplete
  try {
    return roleHasPermission(user.role, permission)
  } catch {
    return false
  }
}

/**
 * Check if current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUserWithPermissions()
  if (!user) return false

  // If any explicit permission matches
  if (permissions.some(p => user.permissions?.includes(p))) return true
  // Fallback: role-based allowance
  return permissions.some(p => {
    try { return roleHasPermission(user.role, p) } catch { return false }
  })
}

/**
 * Check if current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUserWithPermissions()
  if (!user) return false

  // If explicit permissions list covers all
  if (permissions.every(p => user.permissions?.includes(p))) return true
  // Fallback: require role to allow all
  return permissions.every(p => {
    try { return roleHasPermission(user.role, p) } catch { return false }
  })
}

/**
 * Require specific permission - throws error if not authorized
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const hasAccess = await hasPermission(permission)
  if (!hasAccess) {
    throw new Error(`Access denied. Required permission: ${permission}`)
  }
}

/**
 * Require any of the specified permissions - throws error if not authorized
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<void> {
  const hasAccess = await hasAnyPermission(permissions)
  if (!hasAccess) {
    throw new Error(`Access denied. Required permissions: ${permissions.join(' OR ')}`)
  }
}

/**
 * Require all of the specified permissions - throws error if not authorized
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<void> {
  const hasAccess = await hasAllPermissions(permissions)
  if (!hasAccess) {
    throw new Error(`Access denied. Required permissions: ${permissions.join(' AND ')}`)
  }
}

/**
 * Check if user can perform CRUD operations
 */
export async function canPerformCRUD(resource: string): Promise<{
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}> {
  const user = await getCurrentUserWithPermissions()
  if (!user) {
    return { canView: false, canCreate: false, canEdit: false, canDelete: false }
  }

  const permissions = user.permissions || []

  return {
    canView: permissions.includes(`${resource}.view` as Permission),
    canCreate: permissions.includes(`${resource}.create` as Permission),
    canEdit: permissions.includes(`${resource}.edit` as Permission),
    canDelete: permissions.includes(`${resource}.delete` as Permission)
  }
}

/**
 * Get user's CRUD capabilities for multiple resources
 */
export async function getUserCRUDCapabilities(): Promise<Record<string, {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}>> {
  const resources = ['users', 'events', 'roles', 'analytics', 'payments', 'communication', 'design', 'system']
  const capabilities: Record<string, any> = {}

  for (const resource of resources) {
    capabilities[resource] = await canPerformCRUD(resource)
  }

  return capabilities
}

/**
 * Client-side permission hook (for React components)
 */
export function usePermissions() {
  // This would be implemented as a React hook for client-side components
  // For now, we'll create the server-side functions
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerformCRUD,
    getUserCRUDCapabilities
  }
}

/**
 * Permission-based component wrapper
 */
export async function withPermission<T>(
  permission: Permission,
  component: T,
  fallback?: T
): Promise<T | null> {
  const hasAccess = await hasPermission(permission)
  return hasAccess ? component : (fallback || null)
}

/**
 * Role hierarchy for permission inheritance
 * Higher numbers = more privileges
 * Higher roles can access pages/resources meant for lower roles
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  'SUPER_ADMIN': 100,      // Highest level - can access everything
  'TENANT_ADMIN': 80,      // Tenant administrator
  'ADMIN': 70,             // Admin role
  'EVENT_MANAGER': 60,     // Event manager
  'ORGANIZER': 50,         // Event organizer
  'STAFF': 40,             // Staff member
  'USER': 20,              // Regular user
  'GUEST': 10              // Guest/unauthenticated
}

/**
 * Check if user's role has higher or equal level than required role
 */
export async function hasRoleLevel(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUserWithPermissions()
  if (!user) return false

  const userLevel = ROLE_HIERARCHY[user.role] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0

  return userLevel >= requiredLevel
}

/**
 * Get navigation items based on user permissions
 */
export async function getAuthorizedNavigation(): Promise<Array<{
  name: string
  href: string
  permission: Permission
  visible: boolean
}>> {
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', permission: 'analytics.view' as Permission },
    { name: 'Events', href: '/events', permission: 'events.view' as Permission },
    { name: 'Users', href: '/admin/users', permission: 'users.view' as Permission },
    { name: 'Roles & Permissions', href: '/admin/permissions', permission: 'admin.permissions' as Permission },
    { name: 'Analytics', href: '/admin/analytics', permission: 'analytics.view' as Permission },
    { name: 'Settings', href: '/admin/settings', permission: 'system.settings' as Permission }
  ]

  const authorizedItems = []
  for (const item of navigationItems) {
    const visible = await hasPermission(item.permission)
    authorizedItems.push({ ...item, visible })
  }

  return authorizedItems
}
