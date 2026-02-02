'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Shield, Users, Lock, Eye } from 'lucide-react'

type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  createdAt: string
}

const ROLES = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    color: 'purple',
    description: 'Full system access with no restrictions',
    permissions: [
      'Access all features',
      'View all tenants data',
      'Manage all users',
      'Assign any role including SUPER_ADMIN',
      'Delete any event',
      'Override all restrictions',
      'System-wide administration'
    ]
  },
  {
    name: 'ADMIN',
    label: 'Admin',
    color: 'blue',
    description: 'Tenant administrator with full tenant access',
    permissions: [
      'Access admin dashboard',
      'Manage users in their tenant',
      'Create and manage events',
      'View reports and analytics',
      'Assign roles (except SUPER_ADMIN)',
      'Manage tenant settings',
      'View tenant data only'
    ]
  },
  {
    name: 'EVENT_MANAGER',
    label: 'Event Manager',
    color: 'green',
    description: 'Can create and manage events',
    permissions: [
      'Create events',
      'Manage their own events',
      'Add speakers and sponsors',
      'Manage team members',
      'View registrations',
      'Send communications',
      'No admin dashboard access'
    ]
  },
  {
    name: 'USER',
    label: 'User',
    color: 'gray',
    description: 'Regular user with basic access',
    permissions: [
      'View public events',
      'Register for events',
      'View their registrations',
      'Update profile',
      'Cannot create events',
      'No admin access',
      'No management features'
    ]
  }
]

const MODULES = [
  { name: 'Events', roles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'] },
  { name: 'Users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Speakers', roles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'] },
  { name: 'Sponsors', roles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'] },
  { name: 'Registrations', roles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'] },
  { name: 'Team Management', roles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'] },
  { name: 'Admin Dashboard', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'System Settings', roles: ['SUPER_ADMIN'] }
]

export default function RolesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const getColorClasses = (color: string) => {
    const colors = {
      purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage user roles and their permissions</p>
        </div>
      </div>

      {/* System Roles */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">System Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map((role) => {
            const colorClasses = getColorClasses(role.color)
            return (
              <div
                key={role.name}
                className={`border rounded-lg p-4 ${colorClasses.border} ${colorClasses.bg}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${colorClasses.text}`} />
                    <h3 className={`font-semibold ${colorClasses.text}`}>{role.label}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                    {role.name}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{role.description}</p>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Permissions</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {role.permissions.slice(0, 4).map((permission, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {permission}
                      </li>
                    ))}
                    {role.permissions.length > 4 && (
                      <li className="text-gray-500 italic">
                        +{role.permissions.length - 4} more permissions
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Module Access Matrix */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Module Access Matrix</h2>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Module</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Super Admin</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Admin</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Event Manager</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">User</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MODULES.map((module) => (
                <tr key={module.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{module.name}</td>
                  <td className="px-4 py-3 text-center">
                    {module.roles.includes('SUPER_ADMIN') ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {module.roles.includes('ADMIN') ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {module.roles.includes('EVENT_MANAGER') ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {module.roles.includes('USER') ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Super Admins</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-purple-600">1</div>
            <div className="text-xs text-gray-500">System administrators</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Admins</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-600">-</div>
            <div className="text-xs text-gray-500">Tenant administrators</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Event Managers</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-green-600">-</div>
            <div className="text-xs text-gray-500">Event creators</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Users</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-600">-</div>
            <div className="text-xs text-gray-500">Regular users</div>
          </div>
        </div>
      </div>
    </div>
  )
}
