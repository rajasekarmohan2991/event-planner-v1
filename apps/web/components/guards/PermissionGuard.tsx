/**
 * Permission Guard Component
 * Server-side permission checking for pages
 */

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/permissions'
import { getCurrentTenantMembership, isSuperAdmin } from '@/lib/tenant-query'

interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function PermissionGuard({ 
  permission, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const session = await getServerSession(authOptions as any) as any
  
  if (!session || !session.user) {
    redirect('/auth/signin')
  }
  
  // Check if super admin (has all permissions)
  const isAdmin = await isSuperAdmin()
  if (isAdmin) {
    return <>{children}</>
  }
  
  // Get user's tenant role
  try {
    const membership = await getCurrentTenantMembership()
    const allowed = hasPermission(membership.role as any, permission)
    
    if (allowed) {
      return <>{children}</>
    }
  } catch (error) {
    console.error('Permission check error:', error)
  }
  
  // Permission denied
  if (fallback) {
    return <>{fallback}</>
  }
  
  redirect('/unauthorized')
}

/**
 * Require specific tenant role
 */
interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback 
}: RoleGuardProps) {
  const session = await getServerSession(authOptions as any) as any
  
  if (!session || !session.user) {
    redirect('/auth/signin')
  }
  
  // Check if super admin
  const isAdmin = await isSuperAdmin()
  if (isAdmin) {
    return <>{children}</>
  }
  
  // Get user's tenant role
  try {
    const membership = await getCurrentTenantMembership()
    
    if (allowedRoles.includes(membership.role)) {
      return <>{children}</>
    }
  } catch (error) {
    console.error('Role check error:', error)
  }
  
  // Access denied
  if (fallback) {
    return <>{fallback}</>
  }
  
  redirect('/unauthorized')
}

/**
 * Client-side permission check hook
 */
'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession()
  
  return useMemo(() => {
    if (!session?.user) return false
    
    const role = (session.user as any).role
    const tenantRole = (session.user as any).tenantRole
    
    // Super admin has all permissions
    if (role === 'SUPER_ADMIN') return true
    
    // Check tenant role permission
    if (tenantRole) {
      return hasPermission(tenantRole, permission)
    }
    
    return false
  }, [session, permission])
}

/**
 * Client-side role check hook
 */
export function useRole(allowedRoles: string[]): boolean {
  const { data: session } = useSession()
  
  return useMemo(() => {
    if (!session?.user) return false
    
    const role = (session.user as any).role
    const tenantRole = (session.user as any).tenantRole
    
    // Super admin has all roles
    if (role === 'SUPER_ADMIN') return true
    
    // Check tenant role
    if (tenantRole) {
      return allowedRoles.includes(tenantRole)
    }
    
    return false
  }, [session, allowedRoles])
}

/**
 * Client-side component wrapper for permission-based rendering
 */
interface ClientPermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientPermissionGuard({ 
  permission, 
  children, 
  fallback 
}: ClientPermissionGuardProps) {
  const hasAccess = usePermission(permission)
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  return fallback ? <>{fallback}</> : null
}
