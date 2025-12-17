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

// Define sidebar menu items with role-based access for Tenat Admins/Managers
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

// Global Super Admin View Items (When at /super-admin/companies)
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

// Detailed Super Admin View Items (When inside a company context or dashboard)
const SUPER_ADMIN_COMPANY_ITEMS: MenuItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN'] },
  { name: 'All Events', href: '/admin/events', icon: Calendar, roles: ['SUPER_ADMIN'] },
  { name: 'All Users', href: '/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { name: 'Lookup Management', href: '/admin/lookup', icon: FileText, roles: ['SUPER_ADMIN'] },
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

  // Detect which Super Admin view to show
  // We are in "Company View" (Detailed) if we are accessing tenant-specific admin pages
  // We exclude the main landing page '/super-admin/companies'
  const isSuperAdminCompanyView = pathname?.includes('/super-admin/companies/default-tenant') ||
    (isSuperAdmin && (
      pathname === '/admin' ||
      pathname?.startsWith('/admin/') ||
      pathname?.startsWith('/super-admin/diagnostics')
    ))

  // Determine which items to show
  let visiblePlatformItems: MenuItem[] = []
  let visibleMainItems: MenuItem[] = []

  if (isNormalUser) {
    visibleMainItems = USER_MENU_ITEMS
  } else if (isSuperAdmin) {
    if (isSuperAdminCompanyView) {
      // Detailed View: Show Dashboard, Events, Users, etc.
      // Platform section is HIDDEN in detailed view to avoid clutter
      visiblePlatformItems = []
      visibleMainItems = SUPER_ADMIN_COMPANY_ITEMS
    } else {
      // Global View: Show Companies, Settings
      // Main section is HIDDEN
      visiblePlatformItems = SUPER_ADMIN_ITEMS
      visibleMainItems = []
    }
  } else {
    // Tenant Admin / Manager View
    visibleMainItems = MENU_ITEMS.filter(item => {
      // No platform items for regular tenant admins
      if (!tenantRole) return false
      return item.roles.includes(tenantRole)
    })
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo variant="dark" />
          {isSuperAdmin && (
            <span className="mt-1 text-xs text-red-600 font-semibold">SUPER ADMIN</span>
          )}
        </div>

        {/* Platform Menu (Global Items) */}
        {visiblePlatformItems.length > 0 && (
          <div className="mb-6">
            <nav className="space-y-1">
              {visiblePlatformItems.map((item) => {
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

        {/* Main Menu (Detailed/Tenant Items) */}
        <div>
          {isSuperAdmin && isSuperAdminCompanyView && (
            <div className="mb-2 px-3">
              <Link href="/super-admin/companies" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                &larr; Back to Companies
              </Link>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3">
                Company View
              </div>
            </div>
          )}

          {visibleMainItems.length > 0 && (
            <nav className="space-y-1">
              {visibleMainItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          )}
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
