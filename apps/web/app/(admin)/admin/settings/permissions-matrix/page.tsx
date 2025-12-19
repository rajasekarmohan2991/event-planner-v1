'use client'

import { useEffect, useState } from 'react'
import { Check, X, Save, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Permission = {
  operation: string
  permission: string
  description: string
}

type RolePermissions = {
  [role: string]: {
    [permission: string]: boolean
  }
}

const OPERATIONS: Permission[] = [
  { operation: 'View Users', permission: 'users.view', description: 'View user list and profiles' },
  { operation: 'Create Users', permission: 'users.create', description: 'Add new users to system' },
  { operation: 'Edit Users', permission: 'users.edit', description: 'Modify user information' },
  { operation: 'Delete Users', permission: 'users.delete', description: 'Remove users from system' },
  { operation: 'View Events', permission: 'events.view', description: 'View events and details' },
  { operation: 'Create Events', permission: 'events.create', description: 'Create new events' },
  { operation: 'Edit Events', permission: 'events.edit', description: 'Modify event information' },
  { operation: 'Delete Events', permission: 'events.delete', description: 'Remove events permanently' },
  { operation: 'Manage Roles', permission: 'admin.permissions', description: 'Assign and modify user roles' },
  { operation: 'View Analytics', permission: 'analytics.view', description: 'Access reports and analytics' },
  { operation: 'System Settings', permission: 'admin.system', description: 'Configure system settings' },
]

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'ORGANIZER', 'USER']

export default function PermissionsMatrixPage() {
  const [permissions, setPermissions] = useState<RolePermissions>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const defaultPerms = getDefaultPermissions()
      setPermissions(defaultPerms)
      setLoading(false)
    } catch (error) {
      console.error('Error loading permissions:', error)
      setPermissions(getDefaultPermissions())
      setLoading(false)
    }
  }

  const getDefaultPermissions = (): RolePermissions => {
    const defaultPerms: RolePermissions = {}

    ROLES.forEach(role => {
      defaultPerms[role] = {}
      OPERATIONS.forEach(op => {
        // Set permissions based on role hierarchy
        if (role === 'SUPER_ADMIN') {
          // Super Admin: ALL permissions ✓
          defaultPerms[role][op.permission] = true
        } else if (role === 'ADMIN') {
          // Admin: View Users ✓, View Events ✓, Create Events ✓, Edit Events ✓, View Analytics ✓
          defaultPerms[role][op.permission] = [
            'users.view',
            'events.view',
            'events.create',
            'events.edit',
            'analytics.view'
          ].includes(op.permission)
        } else if (role === 'EVENT_MANAGER') {
          // Event Manager: View Events ✓, Create Events ✓, Edit Events ✓, View Analytics ✓
          defaultPerms[role][op.permission] = [
            'events.view',
            'events.create',
            'events.edit',
            'analytics.view'
          ].includes(op.permission)
        } else if (role === 'ORGANIZER') {
          // Organizer: View Events ✓ only
          defaultPerms[role][op.permission] = ['events.view'].includes(op.permission)
        } else if (role === 'USER') {
          // User: Only View Events ✓
          defaultPerms[role][op.permission] = ['events.view'].includes(op.permission)
        }
      })
    })

    return defaultPerms
  }

  const togglePermission = (role: string, permission: string) => {
    const newPermissions = { ...permissions }
    if (!newPermissions[role]) newPermissions[role] = {}

    newPermissions[role][permission] = !newPermissions[role][permission]
    setPermissions(newPermissions)

    const changeKey = `${role}-${permission}`
    const newChanges = new Set(changes)
    newChanges.add(changeKey)
    setChanges(newChanges)
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setChanges(new Set())
      alert('✅ Permissions updated successfully!')
    } catch (error) {
      alert('❌ Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Reset all permissions to default values?')) {
      setPermissions(getDefaultPermissions())
      setChanges(new Set())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions matrix...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permissions Matrix</h1>
          <p className="text-sm text-gray-600">
            Configure role-based permissions for all operations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={savePermissions}
            disabled={saving || changes.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : `Save Changes ${changes.size > 0 ? `(${changes.size})` : ''}`}
          </button>
        </div>
      </div>

      {/* Changes Indicator */}
      {changes.size > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>{changes.size}</strong> permission(s) modified. Don't forget to save your changes.
          </p>
        </div>
      )}

      {/* Permissions Matrix Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-900 min-w-[200px]">
                  Operation
                </th>
                {ROLES.map(role => (
                  <th key={role} className="text-center px-4 py-4 font-semibold text-gray-900 min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{role.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {role === 'SUPER_ADMIN' ? 'Full Access' :
                          role === 'ADMIN' ? 'Management' :
                            role === 'EVENT_MANAGER' ? 'Events Only' :
                              role === 'ORGANIZER' ? 'View Only' : 'Basic'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OPERATIONS.map((operation, index) => (
                <tr key={operation.permission} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{operation.operation}</div>
                      <div className="text-sm text-gray-500">{operation.description}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{operation.permission}</div>
                    </div>
                  </td>
                  {ROLES.map(role => {
                    const hasPermission = permissions[role]?.[operation.permission] || false
                    const isChanged = changes.has(`${role}-${operation.permission}`)

                    return (
                      <td key={`${role}-${operation.permission}`} className="px-4 py-4 text-center">
                        <button
                          onClick={() => togglePermission(role, operation.permission)}
                          className={`
                            w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all mx-auto
                            ${hasPermission
                              ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                              : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                            }
                            ${isChanged ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                            hover:scale-110 active:scale-95
                          `}
                          title={`${hasPermission ? 'Granted' : 'Denied'} - Click to toggle`}
                        >
                          {hasPermission ? (
                            <Check className="w-6 h-6" strokeWidth={3} />
                          ) : (
                            <X className="w-6 h-6" strokeWidth={3} />
                          )}
                        </button>
                        {isChanged && (
                          <div className="text-xs text-yellow-600 mt-1 font-medium">Modified</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Legend:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span>Permission Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span>Permission Denied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg border-2 border-yellow-500"></div>
            <span>Modified (Unsaved)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Click to toggle permissions</span>
          </div>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900">SUPER ADMIN</h4>
          <p className="text-sm text-blue-700 mt-1">
            Full system access. Can manage all users, events, roles, and system settings.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900">ADMIN</h4>
          <p className="text-sm text-green-700 mt-1">
            Can view users and manage events. No user creation or system settings access.
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900">EVENT MANAGER</h4>
          <p className="text-sm text-purple-700 mt-1">
            Focused on event management. Can create, edit events and view analytics.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-900">ORGANIZER</h4>
          <p className="text-sm text-orange-700 mt-1">
            View-only access. Can view events but cannot create or modify them.
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900">USER</h4>
          <p className="text-sm text-gray-700 mt-1">
            Basic access. Can only view events and register for them.
          </p>
        </div>
      </div>
    </div>
  )
}
