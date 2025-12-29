'use client'

import { useState, useEffect } from 'react'

interface ModulePermission {
  module: string
  roles: {
    [key: string]: boolean
  }
}

interface ModuleAccessMatrixProps {
  onSave?: (permissions: ModulePermission[]) => void
}

const MODULES = [
  'Events',
  'Users',
  'Speakers',
  'Sponsors',
  'Registrations',
  'Team Management',
  'Admin Dashboard',
  'System Settings'
]

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'SUPER_ADMIN', color: 'text-purple-600' },
  { key: 'ADMIN', label: 'ADMIN', color: 'text-blue-600' },
  { key: 'EVENT_MANAGER', label: 'EVENT_MANAGER', color: 'text-green-600' },
  { key: 'USER', label: 'USER', color: 'text-gray-600' }
]

const DEFAULT_PERMISSIONS: ModulePermission[] = [
  {
    module: 'Events',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: true, USER: false }
  },
  {
    module: 'Users',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: false, USER: false }
  },
  {
    module: 'Speakers',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: true, USER: false }
  },
  {
    module: 'Sponsors',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: true, USER: false }
  },
  {
    module: 'Registrations',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: true, USER: false }
  },
  {
    module: 'Team Management',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: true, USER: false }
  },
  {
    module: 'Admin Dashboard',
    roles: { SUPER_ADMIN: true, ADMIN: true, EVENT_MANAGER: false, USER: false }
  },
  {
    module: 'System Settings',
    roles: { SUPER_ADMIN: true, ADMIN: false, EVENT_MANAGER: false, USER: false }
  }
]

export default function ModuleAccessMatrix({ onSave }: ModuleAccessMatrixProps) {
  const [permissions, setPermissions] = useState<ModulePermission[]>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  // Load permissions from API
  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/admin/module-access')
      if (response.ok) {
        const data = await response.json()
        // Transform API data to permissions format
        if (data.permissions && Array.isArray(data.permissions)) {
          // Initialize map with defaults to ensure all modules are present
          const permissionsMap: Record<string, ModulePermission> = {}
          // Deep copy defaults
          DEFAULT_PERMISSIONS.forEach(def => {
            permissionsMap[def.module] = JSON.parse(JSON.stringify(def))
          })

          // Override with API data
          data.permissions.forEach((perm: any) => {
            // Add module if not in defaults (backwards compatibility)
            if (!permissionsMap[perm.moduleName]) {
              permissionsMap[perm.moduleName] = {
                module: perm.moduleName,
                roles: {}
              }
            }
            permissionsMap[perm.moduleName].roles[perm.role] = perm.canView || perm.canCreate || perm.canEdit || perm.canDelete
          })
          setPermissions(Object.values(permissionsMap))
        } else {
          setPermissions(DEFAULT_PERMISSIONS)
        }
      } else {
        setPermissions(DEFAULT_PERMISSIONS)
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
      setPermissions(DEFAULT_PERMISSIONS)
    }
  }

  const togglePermission = (moduleIndex: number, roleKey: string) => {
    // SUPER_ADMIN always has access to everything
    if (roleKey === 'SUPER_ADMIN') {
      setNotification({ type: 'error', message: 'SUPER_ADMIN permissions cannot be modified' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    const newPermissions = [...permissions]
    newPermissions[moduleIndex].roles[roleKey] = !newPermissions[moduleIndex].roles[roleKey]
    setPermissions(newPermissions)
    setHasChanges(true)
  }

  const savePermissions = async () => {
    setLoading(true)
    try {
      // Transform permissions to API format
      const permissionsArray = permissions.flatMap(perm =>
        Object.entries(perm.roles).map(([role, hasAccess]) => ({
          moduleName: perm.module,
          role,
          canView: hasAccess,
          canCreate: hasAccess,
          canEdit: hasAccess,
          canDelete: hasAccess
        }))
      )

      const response = await fetch('/api/admin/module-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionsArray })
      })

      if (response.ok) {
        setNotification({ type: 'success', message: 'Permissions updated successfully' })
        setTimeout(() => setNotification(null), 3000)
        setHasChanges(false)
        onSave?.(permissions)
      } else {
        const error = await response.json()
        setNotification({ type: 'error', message: error.message || 'Failed to save permissions' })
        setTimeout(() => setNotification(null), 5000)
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save permissions' })
      setTimeout(() => setNotification(null), 5000)
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    setPermissions(DEFAULT_PERMISSIONS)
    setHasChanges(true)
    setNotification({ type: 'info', message: 'Reset to default permissions' })
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Module Access Matrix</h3>
          <p className="text-sm text-gray-500 mt-1">Which roles can access which modules</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={savePermissions}
            disabled={!hasChanges || loading}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 font-medium text-gray-700 w-64">Module</th>
              {ROLES.map(role => (
                <th key={role.key} className="text-center py-3 px-4 w-32">
                  <div className={`font-medium ${role.color}`}>
                    {role.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission, moduleIndex) => (
              <tr key={permission.module} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">
                  {permission.module}
                </td>
                {ROLES.map(role => {
                  const hasAccess = permission.roles[role.key]
                  const isDisabled = role.key === 'SUPER_ADMIN'

                  return (
                    <td key={role.key} className="py-4 px-4 w-32">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => togglePermission(moduleIndex, role.key)}
                          disabled={isDisabled}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAccess
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                            } ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                          title={isDisabled ? 'SUPER_ADMIN permissions cannot be modified' : `Toggle ${role.label} access to ${permission.module}`}
                        >
                          {hasAccess ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasChanges && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-amber-700">
              You have unsaved changes. Click "Save Changes" to apply them.
            </span>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
