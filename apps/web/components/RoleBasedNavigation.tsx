"use client"

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Calendar, Settings, Shield,
  BarChart3, Mail, CreditCard, Palette, Tag,
  UserCheck, Building, FileText, Home, User
} from 'lucide-react'
import { UserRole, getRoleDefinition, canAccessRoute } from '@/lib/roles-config'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRoles: UserRole[]
  description?: string
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  // Super Admin & Admin Items
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    href: '/admin',
    icon: Shield,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
    description: 'Administrative overview and controls'
  },
  {
    id: 'user-management',
    label: 'User Management',
    href: '/admin/users',
    icon: Users,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
    description: 'Manage users and their roles'
  },
  {
    id: 'verifications',
    label: 'Verifications',
    href: '/admin/verifications',
    icon: UserCheck,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
    description: 'Review and approve user verifications'
  },
  {
    id: 'permissions',
    label: 'Permissions',
    href: '/admin/permissions',
    icon: Shield,
    requiredRoles: ['SUPER_ADMIN'],
    description: 'Manage role permissions and access control'
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
    description: 'Configure system-wide settings'
  },

  // Event Management Items
  {
    id: 'event-dashboard',
    label: 'Event Dashboard',
    href: '/dashboard/event-manager',
    icon: LayoutDashboard,
    requiredRoles: ['EVENT_MANAGER'],
    description: 'Event management overview'
  },
  {
    id: 'event-management',
    label: 'Events',
    href: '/events',
    icon: Calendar,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'ORGANIZER'],
    description: 'Manage events and schedules'
  },
  {
    id: 'create-event',
    label: 'Create Event',
    href: '/events/create',
    icon: Calendar,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'ORGANIZER'],
    description: 'Create new events'
  },
  {
    id: 'registrations',
    label: 'Registrations',
    href: '/events/registrations',
    icon: FileText,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'ORGANIZER'],
    description: 'Manage event registrations'
  },

  // Analytics & Reports
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'],
    description: 'View reports and analytics'
  },

  // Communication
  {
    id: 'communication',
    label: 'Communication',
    href: '/communication',
    icon: Mail,
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'ORGANIZER'],
    description: 'Send emails and notifications'
  },

  // User Dashboard Items
  {
    id: 'user-dashboard',
    label: 'Dashboard',
    href: '/dashboard/user',
    icon: Home,
    requiredRoles: ['USER'],
    description: 'Your personal dashboard'
  },
  {
    id: 'browse-events',
    label: 'Browse Events',
    href: '/events/browse',
    icon: Calendar,
    requiredRoles: ['USER'],
    description: 'Discover and register for events'
  },
  {
    id: 'my-registrations',
    label: 'My Registrations',
    href: '/registrations/my',
    icon: FileText,
    requiredRoles: ['USER'],
    description: 'View your event registrations'
  },

  // Organizer Dashboard Items
  {
    id: 'organizer-dashboard',
    label: 'Organizer Dashboard',
    href: '/dashboard/organizer',
    icon: Building,
    requiredRoles: ['ORGANIZER'],
    description: 'Organizer overview and tools'
  },
  {
    id: 'my-events',
    label: 'My Events',
    href: '/events/my',
    icon: Calendar,
    requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'],
    description: 'Events you created or manage'
  }
]

interface RoleBasedNavigationProps {
  className?: string
  showLabels?: boolean
  orientation?: 'vertical' | 'horizontal'
}

export default function RoleBasedNavigation({
  className = '',
  showLabels = true,
  orientation = 'vertical'
}: RoleBasedNavigationProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const userRole = (session as any)?.user?.role as UserRole

  if (!userRole) {
    return null
  }

  // Filter navigation items based on user role
  const availableItems = NAVIGATION_ITEMS.filter(item =>
    item.requiredRoles.includes(userRole)
  )

  // Get role definition for styling
  const roleDefinition = getRoleDefinition(userRole)

  const handleNavigation = (href: string) => {
    if (canAccessRoute(userRole, href)) {
      router.push(href)
    } else {
      console.warn(`Access denied to route: ${href} for role: ${userRole}`)
    }
  }

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/') return pathname === href
    return pathname.startsWith(href)
  }

  const containerClasses = orientation === 'horizontal'
    ? `flex flex-wrap gap-2 ${className}`
    : `flex flex-col space-y-1 ${className}`

  return (
    <nav className={containerClasses}>
      {/* Role Badge */}
      <div className={`mb-4 p-2 rounded-lg bg-${roleDefinition.color}-50 border border-${roleDefinition.color}-200`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${roleDefinition.color}-500`} />
          <span className={`text-xs font-medium text-${roleDefinition.color}-700`}>
            {roleDefinition.displayName}
          </span>
        </div>
        <p className={`text-xs text-${roleDefinition.color}-600 mt-1`}>
          {roleDefinition.description}
        </p>
      </div>

      {/* Navigation Items */}
      {availableItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.href)}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${active
                ? `bg-${roleDefinition.color}-100 text-${roleDefinition.color}-700 border border-${roleDefinition.color}-200`
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
              ${orientation === 'horizontal' ? 'flex-row' : 'w-full text-left'}
            `}
            title={item.description}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {showLabels && (
              <span className={orientation === 'horizontal' ? 'hidden sm:inline' : ''}>
                {item.label}
              </span>
            )}
            {active && (
              <div className={`ml-auto w-1 h-4 bg-${roleDefinition.color}-500 rounded-full`} />
            )}
          </button>
        )
      })}

      {/* Quick Actions based on role */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">Quick Actions</p>
        {userRole === 'USER' && (
          <button
            onClick={() => handleNavigation('/events/browse')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Find Events
          </button>
        )}
        {['ORGANIZER', 'EVENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole) && (
          <button
            onClick={() => handleNavigation('/events/create')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Create Event
          </button>
        )}
        {['ADMIN', 'SUPER_ADMIN'].includes(userRole) && (
          <button
            onClick={() => handleNavigation('/admin/users')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Manage Users
          </button>
        )}
      </div>
    </nav>
  )
}

// Hook for checking if user can access a route
export function useCanAccessRoute() {
  const { data: session } = useSession()
  const userRole = (session as any)?.user?.role as UserRole

  return (route: string) => {
    if (!userRole) return false
    return canAccessRoute(userRole, route)
  }
}

// Component for protecting routes
export function RouteProtection({
  children,
  requiredRoles,
  fallback
}: {
  children: React.ReactNode
  requiredRoles: UserRole[]
  fallback?: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const userRole = (session as any)?.user?.role as UserRole
  const router = useRouter()

  // DEBUG: Manual session fetch
  const [debugSession, setDebugSession] = React.useState<any>('loading...')
  React.useEffect(() => {
    fetch('/api/auth/session')
      .then(async res => {
        const text = await res.text()
        try {
          setDebugSession(JSON.parse(text))
        } catch (e) {
          setDebugSession({ error: 'Failed to parse JSON', raw: text })
        }
      })
      .catch(err => setDebugSession({ error: 'Fetch failed', msg: err.message }))
  }, [])

  // Redirect logic removed to prevent potential loops with middleware
  // React.useEffect(() => {
  //   if (status === 'unauthenticated') {
  //    const currentPath = window.location.pathname
  //    router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`)
  //   }
  // }, [status, router])

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  // If unauthenticated, show access denied with login button instead of redirecting
  if (status === 'unauthenticated') {
    return (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-red-500 text-xs font-mono mb-2">Debug NextAuth Status: '{status}'</p>
        <div className="text-left bg-gray-100 p-2 rounded mb-4 text-xs font-mono overflow-auto max-h-40">
          <p className="font-bold">Raw /api/auth/session response:</p>
          <pre>{JSON.stringify(debugSession, null, 2)}</pre>
        </div>
        <p className="text-gray-600 mb-4">
          You need to be signed in to access this page.
        </p>
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (!userRole || !requiredRoles.includes(userRole)) {
    return fallback || (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-red-500 text-xs font-mono mb-2">Debug: Your Role is '{userRole || 'undefined'}'</p>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Required roles: {requiredRoles.join(', ')}
        </p>
        <p className="text-sm text-gray-500">
          Your role: {userRole || 'None'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
