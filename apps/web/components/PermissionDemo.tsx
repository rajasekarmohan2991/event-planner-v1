"use client"

import { useState } from 'react'
import { usePermissions, useRoleBasedUI } from '@/hooks/usePermissions'
import PermissionError from '@/components/PermissionError'
import { UserRole } from '@/lib/roles-config'

export default function PermissionDemo() {
  const { userRole, checkPermission, lastError, clearError, showPermissionError } = usePermissions()
  const ui = useRoleBasedUI()
  const [showError, setShowError] = useState(false)
  const [currentError, setCurrentError] = useState<{ permission: any, action: string } | null>(null)

  const handleAction = (permission: any, action: string) => {
    const allowed = checkPermission(permission, action)
    if (!allowed) {
      setCurrentError({ permission, action })
      setShowError(true)
    } else {
      alert(`✅ Success! ${action} completed successfully.`)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800 border-red-300'
      case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'EVENT_MANAGER': return 'bg-green-100 text-green-800 border-green-300'
      case 'ORGANIZER': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'USER': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (!userRole) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to test the permission system.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-4">Role-Based Permission System Demo</h2>
        
        {/* Current Role Display */}
        <div className={`inline-flex items-center px-3 py-2 rounded-lg border font-medium ${getRoleColor(userRole)}`}>
          Current Role: {userRole.replace('_', ' ')}
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">👥 User Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleAction('users.view', 'View Users')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.users.canView 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.users.canView ? '✅' : '❌'} View Users
          </button>
          
          <button
            onClick={() => handleAction('users.create', 'Create User')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.users.canCreate 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.users.canCreate ? '✅' : '❌'} Create Users
          </button>
          
          <button
            onClick={() => handleAction('users.edit', 'Edit User')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.users.canEdit 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.users.canEdit ? '✅' : '❌'} Edit Users
          </button>
          
          <button
            onClick={() => handleAction('users.delete', 'Delete User')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.users.canDelete 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.users.canDelete ? '✅' : '❌'} Delete Users
          </button>
        </div>
      </div>

      {/* Event Management Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">📅 Event Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleAction('events.view', 'View Events')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.events.canView 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.events.canView ? '✅' : '❌'} View Events
          </button>
          
          <button
            onClick={() => handleAction('events.create', 'Create Event')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.events.canCreate 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.events.canCreate ? '✅' : '❌'} Create Events
          </button>
          
          <button
            onClick={() => handleAction('events.edit', 'Edit Event')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.events.canEdit 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.events.canEdit ? '✅' : '❌'} Edit Events
          </button>
          
          <button
            onClick={() => handleAction('events.delete', 'Delete Event')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.events.canDelete 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.events.canDelete ? '✅' : '❌'} Delete Events
          </button>
        </div>
      </div>

      {/* System Management Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ System Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleAction('admin.permissions', 'Manage Roles')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.system.canManageRoles 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.system.canManageRoles ? '✅' : '❌'} Manage Roles
          </button>
          
          <button
            onClick={() => handleAction('analytics.view', 'View Analytics')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.system.canViewAnalytics 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.system.canViewAnalytics ? '✅' : '❌'} View Analytics
          </button>
          
          <button
            onClick={() => handleAction('system.settings', 'System Settings')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              ui.system.canSystemSettings 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
            }`}
          >
            {ui.system.canSystemSettings ? '✅' : '❌'} System Settings
          </button>
        </div>
      </div>

      {/* Permission Matrix Reference */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Permission Matrix Reference</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>SUPER_ADMIN:</strong> ✅ All permissions (Users, Events, Roles, Analytics, System Settings)</p>
          <p><strong>ADMIN:</strong> ✅ View Users, Create/Edit Events, Analytics ❌ Create/Edit/Delete Users, Delete Events, Roles, System Settings</p>
          <p><strong>EVENT_MANAGER:</strong> ✅ Create/Edit Events, Analytics ❌ Users, Delete Events, Roles, System Settings</p>
          <p><strong>USER:</strong> ✅ View Events only ❌ Create/Edit Events, Users, Analytics, Roles, System Settings</p>
        </div>
      </div>

      {/* Error Display */}
      {showError && currentError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <PermissionError
              permission={currentError.permission}
              userRole={userRole}
              action={currentError.action}
              onClose={() => {
                setShowError(false)
                setCurrentError(null)
                clearError()
              }}
              className="m-0 border-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
