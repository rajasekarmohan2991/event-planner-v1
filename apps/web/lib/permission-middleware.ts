import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, hasPermission, hasAnyPermission } from './permission-checker'
import type { Permission } from './roles-config'

/**
 * Permission middleware for API routes
 */
export function withPermissions(requiredPermissions: Permission | Permission[]) {
  return function (handler: Function) {
    return async function (req: NextRequest, ...args: any[]) {
      try {
        // Get current user with permissions
        const user = await getCurrentUserWithPermissions()
        
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        // Check permissions
        let hasAccess = false
        
        if (typeof requiredPermissions === 'string') {
          hasAccess = await hasPermission(requiredPermissions as Permission)
        } else {
          hasAccess = await hasAnyPermission(requiredPermissions as Permission[])
        }

        if (!hasAccess) {
          return NextResponse.json(
            { 
              error: 'Access denied', 
              message: `Required permissions: ${Array.isArray(requiredPermissions) ? requiredPermissions.join(' OR ') : requiredPermissions}`,
              userRole: user.role,
              userPermissions: user.permissions
            },
            { status: 403 }
          )
        }

        // Call the original handler
        return handler(req, ...args)
      } catch (error: any) {
        console.error('Permission middleware error:', error)
        return NextResponse.json(
          { error: 'Permission check failed', message: error.message },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * CRUD permission middleware
 */
export function withCRUDPermissions(resource: string, operation: 'view' | 'create' | 'edit' | 'delete') {
  const permission = `${resource}.${operation}` as Permission
  return withPermissions(permission as Permission)
}

/**
 * Role-based middleware (for backward compatibility)
 */
export function withRole(allowedRoles: string | string[]) {
  return function (handler: Function) {
    return async function (req: NextRequest, ...args: any[]) {
      try {
        const user = await getCurrentUserWithPermissions()
        
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
        
        if (!roles.includes(user.role)) {
          return NextResponse.json(
            { 
              error: 'Access denied', 
              message: `Required roles: ${roles.join(' OR ')}`,
              userRole: user.role
            },
            { status: 403 }
          )
        }

        return handler(req, ...args)
      } catch (error: any) {
        console.error('Role middleware error:', error)
        return NextResponse.json(
          { error: 'Role check failed', message: error.message },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * Permission decorator for API route methods
 */
export function requiresPermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const hasAccess = await hasPermission(permission)
      
      if (!hasAccess) {
        throw new Error(`Access denied. Required permission: ${permission}`)
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Helper to check permissions in API routes with detailed error messages
 */
export async function checkPermissionInRoute(
  permission: string | string[],
  action?: string
): Promise<NextResponse | null> {
  const user = await getCurrentUserWithPermissions()
  
  if (!user) {
    return NextResponse.json(
      { 
        error: 'Authentication Required',
        message: 'You must be logged in to perform this action.',
        suggestion: 'Please log in and try again.',
        contactAdmin: false
      },
      { status: 401 }
    )
  }

  let hasAccess = false
  let requiredPermission = ''

  // Fast-path: Tenant Admins can perform any events.* action
  const permList = Array.isArray(permission) ? permission : [permission]
  const isAllEventsOps = permList.every(p => typeof p === 'string' && p.startsWith('events.'))
  if (user.role === 'TENANT_ADMIN' && isAllEventsOps) {
    return null
  }
  
  if (typeof permission === 'string') {
    hasAccess = await hasPermission(permission as any)
    requiredPermission = permission
  } else {
    hasAccess = await hasAnyPermission(permission as any)
    requiredPermission = permission[0] // Use first permission for error message
  }

  if (!hasAccess) {
    // Import permission error functions
    const { getPermissionError, getRoleGuidance } = await import('./permission-errors')
    const error = getPermissionError(requiredPermission as any, user.role, action)
    const roleGuidance = getRoleGuidance(user.role)

    return NextResponse.json(
      { 
        error: error.title,
        message: error.message,
        suggestion: error.suggestion,
        contactAdmin: error.contactAdmin,
        allowedRoles: error.allowedRoles,
        userRole: user.role,
        roleGuidance: roleGuidance,
        requiredPermissions: Array.isArray(permission) ? permission : [permission]
      },
      { status: 403 }
    )
  }

  return null // No error, permission granted
}
