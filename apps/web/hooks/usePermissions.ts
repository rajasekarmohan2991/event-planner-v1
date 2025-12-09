"use client"

import { useSession } from 'next-auth/react'
import { useState, useCallback } from 'react'
import { UserRole, Permission, hasPermission as roleHasPermission } from '@/lib/roles-config'
import { getPermissionError, formatPermissionError } from '@/lib/permission-errors'

export function usePermissions() {
  const { data: session } = useSession()
  const userRole = (session as any)?.user?.role as UserRole
  const [lastError, setLastError] = useState<string | null>(null)

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!userRole) return false
    return roleHasPermission(userRole, permission)
  }, [userRole])

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!userRole) return false
    return permissions.some(permission => roleHasPermission(userRole, permission))
  }, [userRole])

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!userRole) return false
    return permissions.every(permission => roleHasPermission(userRole, permission))
  }, [userRole])

  // Get error message for a permission
  const getErrorMessage = useCallback((permission: Permission, action?: string): string => {
    if (!userRole) return 'You must be logged in to perform this action.'
    return formatPermissionError(permission, userRole, action)
  }, [userRole])

  // Check permission and set error if denied
  const checkPermission = useCallback((permission: Permission, action?: string): boolean => {
    const allowed = hasPermission(permission)
    if (!allowed) {
      setLastError(getErrorMessage(permission, action))
    } else {
      setLastError(null)
    }
    return allowed
  }, [hasPermission, getErrorMessage])

  // Clear last error
  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  // Show permission error alert
  const showPermissionError = useCallback((permission: Permission, action?: string) => {
    const errorMessage = getErrorMessage(permission, action)
    alert(errorMessage)
  }, [getErrorMessage])

  // Require permission or throw error
  const requirePermission = useCallback((permission: Permission, action?: string): void => {
    if (!checkPermission(permission, action)) {
      throw new Error(getErrorMessage(permission, action))
    }
  }, [checkPermission, getErrorMessage])

  return {
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    requirePermission,
    getErrorMessage,
    showPermissionError,
    lastError,
    clearError,
    isAuthenticated: !!session,
    isLoading: !session && typeof window !== 'undefined'
  }
}

// Hook for specific permission checks
export function usePermissionCheck(permission: Permission) {
  const { hasPermission, getErrorMessage, userRole } = usePermissions()
  
  return {
    allowed: hasPermission(permission),
    denied: !hasPermission(permission),
    errorMessage: hasPermission(permission) ? null : getErrorMessage(permission),
    userRole
  }
}

// Hook for role-based UI rendering
export function useRoleBasedUI() {
  const { userRole, hasPermission } = usePermissions()

  const canViewUsers = hasPermission('users.view')
  const canCreateUsers = hasPermission('users.create')
  const canEditUsers = hasPermission('users.edit')
  const canDeleteUsers = hasPermission('users.delete')

  const canViewEvents = hasPermission('events.view')
  const canCreateEvents = hasPermission('events.create')
  const canEditEvents = hasPermission('events.edit')
  const canDeleteEvents = hasPermission('events.delete')

  const canManageRoles = hasPermission('admin.permissions')
  const canViewAnalytics = hasPermission('analytics.view')
  const canSystemSettings = hasPermission('system.settings')

  return {
    userRole,
    users: {
      canView: canViewUsers,
      canCreate: canCreateUsers,
      canEdit: canEditUsers,
      canDelete: canDeleteUsers
    },
    events: {
      canView: canViewEvents,
      canCreate: canCreateEvents,
      canEdit: canEditEvents,
      canDelete: canDeleteEvents
    },
    system: {
      canManageRoles,
      canViewAnalytics,
      canSystemSettings
    }
  }
}
