'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  LogOut,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  BarChart3,
  Menu,
  ChevronLeft,
  Shield
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
  exact?: boolean
}

interface AdminSidebarProps {
  onClose?: () => void
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true
    },
    // Super Admin only - Companies
    ...(isSuperAdmin ? [{
      name: 'Companies',
      href: '/super-admin/companies',
      icon: <Shield className="h-5 w-5" />,
    }] : []),
    {
      name: 'Events',
      href: '/admin/events',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Organizations',
      href: '/admin/organizations',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const isActive = (href: string, exact: boolean = false) => {
    if (!pathname) return false;
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className={cn(
      "h-full flex flex-col bg-white transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className={cn("flex items-center transition-opacity", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold mr-3">
            EP
          </div>
          <h1 className="text-lg font-semibold text-gray-800 whitespace-nowrap">Event Planner</h1>
        </div>

        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
              onClose ? 'lg:hidden' : ''
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {onClose ? (
              <X className="h-5 w-5 text-gray-500" />
            ) : isCollapsed ? (
              <Menu className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isItemActive = isActive(item.href, item.exact)

          return (
            <TooltipProvider key={item.href} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="mb-1"
                  >
                    <Link
                      href={item.disabled ? '#' : item.href}
                      className={cn(
                        'flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all group',
                        isItemActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        item.disabled && 'opacity-50 cursor-not-allowed',
                        isCollapsed ? 'justify-center' : 'justify-start'
                      )}
                      onClick={(e) => {
                        if (item.disabled) {
                          e.preventDefault()
                        } else if (onClose) {
                          onClose()
                        }
                      }}
                    >
                      <span className={cn("flex items-center justify-center", isCollapsed ? 'mr-0' : 'mr-3')}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span>{item.name}</span>
                          {item.disabled && (
                            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </motion.div>
                </TooltipTrigger>
                {(isCollapsed || item.disabled) && (
                  <TooltipContent side="right">
                    <p>{item.disabled ? 'Coming soon!' : item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors",
                isCollapsed ? 'justify-center' : 'justify-between'
              )}
              aria-label="User menu"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email || 'admin@example.com'}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side={isCollapsed ? 'right' : 'top'}>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email || 'admin@example.com'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings/profile" className="w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isCollapsed && (
          <div className="border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-500 hover:text-gray-700 justify-start"
              asChild
            >
              <Link href="/admin/help">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>Help & Support</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
