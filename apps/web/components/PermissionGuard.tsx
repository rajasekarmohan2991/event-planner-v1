'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

type PermissionGuardProps = {
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

type UserPermissions = {
  role: string
  permissions: string[]
}

export function PermissionGuard({
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { data: session, status } = useSession()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserPermissions() {
      if (status === 'loading') return
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/permissions')
        if (response.ok) {
          const data = await response.json()
          setUserPermissions(data)
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPermissions()
  }, [session, status])

  if (loading || status === 'loading') {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
  }

  if (!session?.user || !userPermissions) {
    return <>{fallback}</>
  }

  // Check role-based access
  if (role && userPermissions.role !== role) {
    return <>{fallback}</>
  }

  if (roles && !roles.includes(userPermissions.role)) {
    return <>{fallback}</>
  }

  // Check permission-based access
  if (permission && !userPermissions.permissions.includes(permission)) {
    return <>{fallback}</>
  }

  if (permissions) {
    const hasAccess = requireAll
      ? permissions.every(p => userPermissions.permissions.includes(p))
      : permissions.some(p => userPermissions.permissions.includes(p))
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Hook for checking permissions in components
export function usePermissions() {
  const { data: session } = useSession()
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)

  useEffect(() => {
    async function fetchUserPermissions() {
      if (!session?.user) return

      try {
        const response = await fetch('/api/auth/permissions')
        if (response.ok) {
          const data = await response.json()
          setUserPermissions(data)
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error)
      }
    }

    fetchUserPermissions()
  }, [session])

  const hasPermission = (permission: string): boolean => {
    return userPermissions?.permissions.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => userPermissions?.permissions.includes(p)) || false
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => userPermissions?.permissions.includes(p)) || false
  }

  const hasRole = (role: string): boolean => {
    return userPermissions?.role === role || false
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(userPermissions?.role || '') || false
  }

  const canPerformCRUD = (resource: string) => {
    return {
      canView: hasPermission(`${resource}.view`),
      canCreate: hasPermission(`${resource}.create`),
      canEdit: hasPermission(`${resource}.edit`),
      canDelete: hasPermission(`${resource}.delete`)
    }
  }

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canPerformCRUD,
    isLoading: !userPermissions && !!session?.user
  }
}

// Component for showing/hiding UI elements based on permissions
export function PermissionButton({
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  children,
  ...props
}: PermissionGuardProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      role={role}
      roles={roles}
      requireAll={requireAll}
      fallback={null}
    >
      <button {...props}>
        {children}
      </button>
    </PermissionGuard>
  )
}

// Component for conditional rendering based on CRUD permissions
export function CRUDGuard({
  resource,
  operation,
  fallback = null,
  children
}: {
  resource: string
  operation: 'view' | 'create' | 'edit' | 'delete'
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <PermissionGuard
      permission={`${resource}.${operation}`}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}
