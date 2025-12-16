'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight, Building2, Home, Shield, Database, List } from 'lucide-react'
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
      pathname?.startsWith('/admin/events') ||
      pathname?.startsWith('/admin/users') ||
      pathname?.startsWith('/admin/lookup') ||
      pathname?.startsWith('/admin/currency') ||
      pathname?.startsWith('/super-admin/settings') ||
      pathname?.startsWith('/super-admin/lookups');

    if (isIndividualCompanyView) {
      // Inside Individual Company: Show limited options with back to companies
      baseNavigation.push(
        { name: 'Back to Companies', href: '/super-admin/companies', icon: Building2 },
        { name: 'Dashboard', href: `/super-admin/companies/${currentCompanyId}`, icon: LayoutDashboard }
      )
    } else if (isSuperAdminCompanyView) {
      // Inside Super Admin Company: Show full system modules
      baseNavigation.push(
        { name: 'Dashboard', href: `/super-admin/companies/${currentCompanyId}`, icon: LayoutDashboard },
        { name: 'Events', href: '/admin/events', icon: Calendar },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Lookup Data', href: '/admin/lookup', icon: Database },
        { name: 'Lookup Management', href: '/super-admin/lookups', icon: List },
        { name: 'Currency Settings', href: '/admin/currency', icon: Shield },
        { name: 'System Settings', href: '/super-admin/settings', icon: Settings }
      )
    } else {
      // Global Super Admin View: Only Companies and Settings
      baseNavigation.push(
        { name: 'Companies', href: '/super-admin/companies', icon: Building2 },
        { name: 'Settings', href: '/admin/settings', icon: Settings }
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
          'bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl',
          'border-r border-slate-700/50 shadow-2xl',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        )}
      >
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-50 hidden lg:flex items-center justify-center w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400 rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-white" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white" />
          )}
        </button>
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
          {/* Logo removed from Desktop Sidebar as it is now in Header */}
          
          <nav className="mt-4 flex-1 px-3 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                      'flex-shrink-0 h-6 w-6 transition-all',
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
        <div className="mt-auto p-4 border-t border-slate-700 bg-slate-900/50">
          <Button
            variant="ghost"
            title={isCollapsed ? 'Sign out' : undefined}
            className={cn(
              "w-full text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all rounded-lg",
              isCollapsed ? 'justify-center px-2' : 'justify-start'
            )}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className={cn(
              "h-5 w-5 text-slate-400",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && <span>Sign out</span>}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-[60] w-72 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl',
          'transform transition-transform duration-300 ease-in-out lg:hidden',
          'flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-start flex-shrink-0 px-4 mb-6">
            <Link href="/admin" className="flex items-center gap-2">
              <BrandLogo variant="dark" />
            </Link>
          </div>
          <nav className="mt-2 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                      'mr-3 flex-shrink-0 h-6 w-6'
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
        <div className="mt-auto p-4 border-t border-slate-700 bg-slate-900/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all rounded-lg"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400" />
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
