'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Calendar, Users, Building2, Palette,
  Mail, FileText, Clock, Settings, DollarSign, Shield,
  CheckSquare, BarChart3, Ticket, Trash2, UserCheck,
  Activity, CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/BrandLogo'

interface MenuItem {
  name: string
  href: string
  icon: any
  roles: string[]
  badge?: string
}

// Menu items for normal users (USER role)
const USER_MENU_ITEMS: MenuItem[] = [
  {
    name: 'Browse Events',
    href: '/events',
    icon: Calendar,
    roles: ['USER', 'ATTENDEE']
  },
  {
    name: 'My Registrations',
    href: '/my-registrations',
    icon: Ticket,
    roles: ['USER', 'ATTENDEE']
  },
]

// Define sidebar menu items with role-based access
const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'VIEWER']
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'VIEWER']
  },
  {
    name: 'Trashed Events',
    href: '/events/trashed',
    icon: Trash2,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN']
  },
  {
    name: 'Team Approvals',
    href: '/team-approvals',
    icon: UserCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN']
  },
  {
    name: 'Exhibitor Approvals',
    href: '/exhibitor-approvals',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER']
  },
  {
    name: 'Registrations',
    href: '/registrations',
    icon: CheckSquare,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'VIEWER']
  },
  {
    name: 'Vendors',
    href: '/company/vendors',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER']
  },
  {
    name: 'Design',
    href: '/design',
    icon: Palette,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER']
  },
  {
    name: 'Communicate',
    href: '/communicate',
    icon: Mail,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER']
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER', 'VIEWER']
  },
  {
    name: 'Event Day',
    href: '/eventday',
    icon: Clock,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'SUPPORT_STAFF']
  },
  {
    name: 'Venues',
    href: '/venues',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER']
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN']
  },
]

// Super Admin only menu items
const SUPER_ADMIN_ITEMS: MenuItem[] = [
  {
    name: 'Companies',
    href: '/super-admin/companies',
    icon: Building2,
    roles: ['SUPER_ADMIN']
  },
  {
    name: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN']
  }
]

// Menu items for "Super Admin Company" context (Default Organization)
// Menu items for "Super Admin Company" context (Default Organization)
// Menu items for "Super Admin Company" context (Default Organization)
const SUPER_ADMIN_COMPANY_ITEMS: MenuItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN'] },
  { name: 'All Events', href: '/admin/events', icon: Calendar, roles: ['SUPER_ADMIN'] },
  { name: 'All Users', href: '/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { name: 'Lookup Management', href: '/admin/lookup', icon: FileText, roles: ['SUPER_ADMIN'] },
  // Currency removed from main menu as per request, moved to System Settings
  { name: 'System Settings', href: '/admin/system-settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  { name: 'Billing & Subscription', href: '/admin/billing', icon: CreditCard, roles: ['SUPER_ADMIN'] },
  { name: 'Run Diagnostics', href: '/super-admin/diagnostics', icon: Activity, roles: ['SUPER_ADMIN'] },
]

export function RoleBasedSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) {
    return null
  }

  const systemRole = (session.user as any).role
  const tenantRole = (session.user as any).tenantRole
  const isSuperAdmin = systemRole === 'SUPER_ADMIN'
  const isNormalUser = systemRole === 'USER' || (!tenantRole && systemRole !== 'SUPER_ADMIN')
  // Super Admin Company view includes the dashboard and all module pages
  const isSuperAdminCompanyView = pathname?.includes('/super-admin/companies/default-tenant') ||
    (isSuperAdmin && (
      pathname === '/admin' ||
      pathname?.startsWith('/admin/') ||
      pathname?.startsWith('/admin/events') ||
      pathname?.startsWith('/admin/users') ||
      pathname?.startsWith('/admin/lookup') ||
      // Currency removed but path remains valid if accessed directly
      pathname?.startsWith('/admin/currency') ||
      pathname?.startsWith('/admin/system-settings') ||
      pathname?.startsWith('/admin/billing') ||
      pathname?.startsWith('/super-admin/diagnostics')
    ))

  // Filter menu items based on role
  let visibleItems: MenuItem[] = []

  if (isNormalUser) {
    // Normal users only see USER_MENU_ITEMS
    visibleItems = USER_MENU_ITEMS
  } else if (isSuperAdmin && isSuperAdminCompanyView) {
    // When viewing Super Admin Company, show specific system modules
    visibleItems = SUPER_ADMIN_COMPANY_ITEMS
  } else if (isSuperAdmin && !isSuperAdminCompanyView) {
    // Global Super Admin View: Hide generic tenant items, show only Global items
    visibleItems = []
  } else {
    // Admin/Manager users see MENU_ITEMS based on their tenant role
    visibleItems = MENU_ITEMS.filter(item => {
      if (isSuperAdmin) return true // Super admin sees everything
      if (!tenantRole) return false // No tenant role, no access
      return item.roles.includes(tenantRole)
    })
  }

  const visibleSuperAdminItems = isSuperAdmin && !isSuperAdminCompanyView ? SUPER_ADMIN_ITEMS : []

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo variant="dark" />
          {isSuperAdmin && (
            <span className="mt-1 text-xs text-red-600 font-semibold">SUPER ADMIN</span>
          )}
        </div>

        {/* Super Admin Section - Only show when NOT in Super Admin Company view (or keep it?)
            The user says "only companies settings will be remain ter".
            If we are in Super Admin Company view, we want to show the modules "under default organisation".
            The image shows "System Settings" page with the sidebar having these items.
            So we likely want to HIDE the "Platform" section when in this view, OR merge them.
            I'll hide the Platform section when in Super Admin Company view (via visibleSuperAdminItems logic above).
         */}
        {visibleSuperAdminItems.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              Platform
            </div>
            <nav className="space-y-1">
              {visibleSuperAdminItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        {/* Main Menu */}
        <div>
          {isSuperAdmin && !isSuperAdminCompanyView && visibleItems.length > 0 && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              Tenant
            </div>
          )}
          {isSuperAdmin && isSuperAdminCompanyView && (
            <div className="mb-2 px-3">
              <Link href="/super-admin/companies" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                &larr; Back to Companies
              </Link>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3">
                Super Admin Company
              </div>
            </div>
          )}
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Role Badge */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Your Role</div>
            <div className="text-sm font-semibold text-gray-900">
              {isSuperAdmin ? 'Super Admin' : tenantRole || 'No Role'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

/**
 * Minimal sidebar for unauthenticated users
 */
export function PublicSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg">Event Planner</h1>
        </div>

        <nav className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/auth/signin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <Users className="w-5 h-5" />
            <span>Sign In</span>
          </Link>
        </nav>
      </div>
    </aside>
  )
}
