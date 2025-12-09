'use client'

import { useState, useEffect } from 'react'
import { Check, X, RotateCcw, Save } from 'lucide-react'

interface Permission {
  id: string
  moduleName: string
  role: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

interface Operation {
  key: string
  name: string
  description: string
  permissionKey: string
}

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'SUPER ADMIN', subtitle: 'Full Access' },
  { key: 'ADMIN', label: 'ADMIN', subtitle: 'Management' },
  { key: 'EVENT_MANAGER', label: 'EVENT MANAGER', subtitle: 'Events Only' },
  { key: 'ORGANIZER', label: 'ORGANIZER', subtitle: 'View Only' },
  { key: 'USER', label: 'USER', subtitle: 'Basic' }
]

const OPERATIONS: Operation[] = [
  { key: 'view_users', name: 'View Users', description: 'View user list and profiles', permissionKey: 'users.view' },
  { key: 'create_users', name: 'Create Users', description: 'Add new users to system', permissionKey: 'users.create' },
  { key: 'edit_users', name: 'Edit Users', description: 'Modify user information', permissionKey: 'users.edit' },
  { key: 'delete_users', name: 'Delete Users', description: 'Remove users from system', permissionKey: 'users.delete' },
  { key: 'view_events', name: 'View Events', description: 'View events and details', permissionKey: 'events.view' },
  { key: 'create_events', name: 'Create Events', description: 'Create new events', permissionKey: 'events.create' },
  { key: 'edit_events', name: 'Edit Events', description: 'Modify event information', permissionKey: 'events.edit' },
  { key: 'delete_events', name: 'Delete Events', description: 'Remove events from system', permissionKey: 'events.delete' },
  { key: 'view_registrations', name: 'View Registrations', description: 'View registration data', permissionKey: 'registrations.view' },
  { key: 'manage_registrations', name: 'Manage Registrations', description: 'Approve/reject registrations', permissionKey: 'registrations.manage' },
]

export default function PermissionsMatrix() {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/admin/module-access')
      if (response.ok) {
        const data = await response.json()
        // Transform API data to permissions matrix
        const matrix: Record<string, Record<string, boolean>> = {}
        
        OPERATIONS.forEach(op => {
          matrix[op.key] = {}
          ROLES.forEach(role => {
            // Default permissions based on role
            if (role.key === 'SUPER_ADMIN') {
              matrix[op.key][role.key] = true
            } else if (role.key === 'ADMIN') {
              matrix[op.key][role.key] = !op.key.includes('delete_users')
            } else if (role.key === 'EVENT_MANAGER') {
              matrix[op.key][role.key] = op.key.includes('events') || op.key.includes('registrations')
            } else if (role.key === 'ORGANIZER') {
              matrix[op.key][role.key] = op.key.includes('view')
            } else {
              matrix[op.key][role.key] = op.key === 'view_events'
            }
          })
        })
        
        setPermissions(matrix)
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
    }
  }

  const togglePermission = (operationKey: string, roleKey: string) => {
    if (roleKey === 'SUPER_ADMIN') {
      setMessage({ type: 'error', text: 'SUPER ADMIN permissions cannot be modified' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setPermissions(prev => ({
      ...prev,
      [operationKey]: {
        ...prev[operationKey],
        [roleKey]: !prev[operationKey]?.[roleKey]
      }
    }))
    setHasChanges(true)
  }

  const resetToDefaults = () => {
    loadPermissions()
    setHasChanges(false)
    setMessage({ type: 'success', text: 'Reset to default permissions' })
    setTimeout(() => setMessage(null), 3000)
  }

  const saveChanges = async () => {
    setLoading(true)
    try {
      // Transform permissions matrix to API format
      const permissionsArray = []
      
      for (const [opKey, roles] of Object.entries(permissions)) {
        const operation = OPERATIONS.find(o => o.key === opKey)
        if (!operation) continue
        
        for (const [roleKey, hasPermission] of Object.entries(roles)) {
          const [module, action] = operation.permissionKey.split('.')
          
          permissionsArray.push({
            moduleName: module.charAt(0).toUpperCase() + module.slice(1),
            role: roleKey,
            canView: action === 'view' ? hasPermission : false,
            canCreate: action === 'create' ? hasPermission : false,
            canEdit: action === 'edit' ? hasPermission : false,
            canDelete: action === 'delete' ? hasPermission : false
          })
        }
      }

      const response = await fetch('/api/admin/module-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionsArray })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions saved successfully!' })
        setHasChanges(false)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Failed to save permissions' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving permissions' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Permissions Matrix</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure role-based permissions for all operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={saveChanges}
              disabled={!hasChanges || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-64">
                Operation
              </th>
              {ROLES.map(role => (
                <th key={role.key} className="px-4 py-4 text-center">
                  <div className="text-sm font-semibold text-gray-900">{role.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{role.subtitle}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {OPERATIONS.map((operation) => (
              <tr key={operation.key} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{operation.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{operation.description}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">{operation.permissionKey}</div>
                  </div>
                </td>
                {ROLES.map(role => {
                  const hasPermission = permissions[operation.key]?.[role.key] || false
                  const isLocked = role.key === 'SUPER_ADMIN'
                  
                  return (
                    <td key={role.key} className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => togglePermission(operation.key, role.key)}
                          disabled={isLocked}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                            hasPermission
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          } ${isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                          title={isLocked ? 'SUPER ADMIN permissions are locked' : `Toggle ${role.label} access`}
                        >
                        {hasPermission ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
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

      {/* Footer Message */}
      {hasChanges && (
        <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>You have unsaved changes. Click "Save Changes" to apply them.</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}
    </div>
  )
}
