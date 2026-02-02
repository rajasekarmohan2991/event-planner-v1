"use client"

import { AlertTriangle, Shield, Mail, Users, Settings } from 'lucide-react'
import { UserRole, Permission } from '@/lib/roles-config'
import { getPermissionError, getRoleGuidance } from '@/lib/permission-errors'

interface PermissionErrorProps {
  permission: Permission
  userRole: UserRole
  action?: string
  onClose?: () => void
  className?: string
}

export default function PermissionError({ 
  permission, 
  userRole, 
  action, 
  onClose,
  className = '' 
}: PermissionErrorProps) {
  const error = getPermissionError(permission, userRole, action)
  const roleGuidance = getRoleGuidance(userRole)

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'text-red-600 bg-red-50 border-red-200'
      case 'ADMIN': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'EVENT_MANAGER': return 'text-green-600 bg-green-50 border-green-200'
      case 'ORGANIZER': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'USER': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            {error.title}
          </h3>
          <p className="text-red-700">
            {error.message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Current Role Info */}
      <div className={`p-3 rounded-lg border mb-4 ${getRoleColor(userRole)}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Your Current Role: {userRole.replace('_', ' ')}</span>
        </div>
        <p className="text-sm">{roleGuidance}</p>
      </div>

      {/* Suggestion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-800 mb-1">Required Access Level</p>
            <p className="text-sm text-blue-700">{error.suggestion}</p>
            <div className="mt-2">
              <span className="text-xs text-blue-600">Allowed roles: </span>
              {error.allowedRoles.map((role, index) => (
                <span key={role} className="text-xs font-medium text-blue-800">
                  {role.replace('_', ' ')}
                  {index < error.allowedRoles.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Admin */}
      {error.contactAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">Need Access?</p>
              <p className="text-sm text-yellow-700 mb-2">
                Contact your system administrator to request the necessary permissions for this action.
              </p>
              <div className="flex gap-2">
                <button className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors">
                  Contact Admin
                </button>
                <button className="text-xs border border-yellow-600 text-yellow-600 px-3 py-1 rounded hover:bg-yellow-600 hover:text-white transition-colors">
                  View Help
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Toast notification component for permission errors
export function PermissionErrorToast({ 
  permission, 
  userRole, 
  action,
  onClose 
}: PermissionErrorProps) {
  const error = getPermissionError(permission, userRole, action)

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-lg max-w-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-red-800 mb-1">{error.title}</h4>
          <p className="text-sm text-red-700 mb-2">{error.message}</p>
          <p className="text-xs text-red-600">{error.suggestion}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// Modal component for permission errors
export function PermissionErrorModal({ 
  permission, 
  userRole, 
  action, 
  onClose 
}: PermissionErrorProps & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <PermissionError
          permission={permission}
          userRole={userRole}
          action={action}
          onClose={onClose}
          className="m-0 border-0 bg-white"
        />
      </div>
    </div>
  )
}
