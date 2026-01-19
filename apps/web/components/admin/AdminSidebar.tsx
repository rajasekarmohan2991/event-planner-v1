'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight, Building2, Home, Shield, Database, List, Activity, CreditCard, Wallet, Receipt, Globe, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useSidebar } from '@/contexts/SidebarContext'
import { BrandLogo } from '@/components/BrandLogo'

const getNavigation = (userRole?: string, pathname?: string) => {
  const baseNavigation = []

  // Extract company ID if we are in a company view
  const companyIdMatch = pathname?.match(/\/super-admin\/companies\/([^/]+)/);
  const currentCompanyId = companyIdMatch ? companyIdMatch[1] : 'default-tenant';

  // Check if viewing Super Admin Company (dashboard or any module pages)
  // We are in a company view if:
  // 1. We are at /super-admin/companies/[id] (but not the list page itself)
  // 2. OR we are in one of the admin sub-pages (context assumption)
  const isCompanyPage = pathname?.startsWith('/super-admin/companies/') && pathname !== '/super-admin/companies';

  // SUPER_ADMIN: Different menus based on context
  if (userRole === 'SUPER_ADMIN') {
    // Check if we are viewing a specific company that is NOT the default tenant (Super Admin Company)
    const isIndividualCompanyView = isCompanyPage && currentCompanyId !== 'default-tenant';

    // Check if we are in the Super Admin Company context (Default Tenant)
    // This includes:
    // 1. Explicitly viewing default-tenant dashboard
    // 2. Viewing global admin modules (Events, Users, Lookup, Currency) which belong to the system/default tenant
    // 3. Viewing System Settings
    const isSuperAdminCompanyView = (isCompanyPage && currentCompanyId === 'default-tenant') ||
      pathname === '/admin' || // Exact dashboard match
      pathname?.startsWith('/admin/events') ||
      pathname?.startsWith('/admin/users') ||
      pathname?.startsWith('/admin/lookup') ||
      pathname?.startsWith('/admin/system-settings') ||
      pathname?.startsWith('/admin/billing-subscription') ||
      pathname?.startsWith('/super-admin/diagnostics') ||
      pathname?.startsWith('/admin/currency');

    if (isIndividualCompanyView) {
      // Inside Individual Company: Show company modules in left sidebar
      baseNavigation.push(
        { name: 'Back to Companies', href: '/super-admin/companies', icon: ChevronLeft },
        { name: 'Dashboard', href: `/super-admin/companies/${currentCompanyId}`, icon: LayoutDashboard },
        { name: 'Users', href: `/super-admin/companies/${currentCompanyId}/users`, icon: Users },
        { name: 'Tax Settings', href: `/super-admin/companies/${currentCompanyId}/tax-structures`, icon: Database },
        { name: 'System Settings', href: `/super-admin/companies/${currentCompanyId}/settings`, icon: Settings }
      )
    } else if (isSuperAdminCompanyView) {
      // Inside Super Admin Company (Detailed View): Show full system modules
      // This is the "Detailed" view requested by the user
      // 1. Dashboard (Points to /admin)
      // 2. All Events
      // 3. All Users
      // 4. Lookup Management
      // 5. Finance (NEW!)
      // 6. System Settings (Consolidated)
      // 7. Billing & Subscription
      // 8. Run Diagnostics
      baseNavigation.push(
        { name: 'Back to Companies', href: '/super-admin/companies', icon: ChevronLeft }, // Helpful back link
        { name: 'Dashboard', href: `/admin`, icon: LayoutDashboard },
        { name: 'All Events', href: '/admin/events', icon: Calendar },
        { name: 'All Users', href: '/admin/users', icon: Users },
        { name: 'Lookup Management', href: '/admin/lookup', icon: Database },
        { name: 'Finance', href: `/super-admin/companies/${currentCompanyId}/finance`, icon: Wallet },
        { name: 'Tax Settings', href: `/super-admin/companies/${currentCompanyId}/tax-structures`, icon: Globe },
        { name: 'System Settings', href: '/admin/system-settings', icon: Settings },
        { name: 'Billing & Subscription', href: '/admin/billing-subscription', icon: CreditCard },
        { name: 'Run Diagnostics', href: '/super-admin/diagnostics', icon: Activity }
      )
    } else {
      // Global Super Admin View: Only Companies and Settings
      // This is the "Landing" view requested by the user
      baseNavigation.push(
        { name: 'Companies', href: '/super-admin/companies', icon: Building2 },
        { name: 'Digital Signatures', href: '/super-admin/signatures/templates', icon: FileText },
        { name: 'Settings', href: '/super-admin/settings', icon: Settings }
      )
    }
    return baseNavigation
  }

  // ADMIN and EVENT_MANAGER: Original logic
  baseNavigation.push({ name: 'Dashboard', href: '/admin', icon: Home })

  if (userRole === 'ADMIN' || userRole === 'EVENT_MANAGER') {
    baseNavigation.push({ name: 'Company', href: '/company', icon: Building2 })
  }

  baseNavigation.push({ name: 'Events', href: '/admin/events', icon: Calendar })

  if (userRole === 'ADMIN' || userRole === 'TENANT_ADMIN') {
    baseNavigation.push({ name: 'Users', href: '/admin/users', icon: Users })
    // Add Finance for company admins
    baseNavigation.push({ name: 'Finance', href: '/admin/invoices', icon: Wallet })
    // Add Tax Settings for company admins
    baseNavigation.push({ name: 'Tax Settings', href: '/admin/settings/tax', icon: Receipt })
    // Add Digital Signatures for company admins
    baseNavigation.push({ name: 'Digital Signatures', href: '/admin/signatures', icon: FileText })
  }

  baseNavigation.push({ name: 'Settings', href: '/admin/settings', icon: Settings })

  return baseNavigation
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const [mounted, setMounted] = useState(false)

  const navigation = getNavigation((session?.user as any)?.role, pathname)

  // Only show the sidebar toggle on mobile after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile sidebar when navigating
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname, setIsMobileOpen])

  return (
    <>
      {/* Mobile menu button */}
      {mounted && (
        <button
          type="button"
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <span className="sr-only">Toggle sidebar</span>
          {isMobileOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-[40] lg:flex lg:flex-col',
          'bg-white dark:bg-slate-900',
          'border-r border-slate-200 dark:border-slate-800',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-50 hidden lg:flex items-center justify-center w-6 h-6 bg-violet-600 hover:bg-violet-700 rounded-full shadow-lg shadow-violet-500/30 transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-white" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white" />
          )}
        </button>
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
          {/* Logo removed from Desktop Sidebar as it is now in Header */}

          <nav className="mt-2 flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300',
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                    isCollapsed && 'justify-center px-3'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400',
                      'flex-shrink-0 h-5 w-5 transition-all',
                      !isCollapsed && 'mr-3'
                    )}
                    aria-hidden="true"
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
        {/* Logout at bottom */}
        <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            title={isCollapsed ? 'Sign out' : undefined}
            className={cn(
              "w-full text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all rounded-xl",
              isCollapsed ? 'justify-center px-3' : 'justify-start'
            )}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className={cn(
              "h-5 w-5",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && <span>Sign out</span>}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl',
          'transform transition-transform duration-300 ease-in-out lg:hidden',
          'flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-start flex-shrink-0 px-4 mb-6">
            <Link href="/admin" className="flex items-center gap-2">
              <BrandLogo variant="light" />
            </Link>
          </div>
          <nav className="mt-2 flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300',
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-violet-600',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        {/* Logout at bottom - Mobile */}
        <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all rounded-xl"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
