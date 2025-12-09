'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
// UserRole enum removed from schema, using string values directly
import { Button } from '@/components/ui/button'
import { Home, Calendar, Users, Settings, LogOut, Ticket, LayoutDashboard, User as UserIcon } from 'lucide-react'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const sidebarNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
  },
  {
    name: 'My Tickets',
    href: '/user/tickets',
    icon: Ticket,
    roles: ['USER'],
  },
  {
    name: 'Manage Events',
    href: '/organizer/events',
    icon: Calendar,
    roles: ['ORGANIZER'],
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  
  // Get user role from session (you'll need to implement this)
  const userRole = 'USER' // Replace with actual user role from session

  const filteredItems = sidebarNavItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span>Event Planner</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  pathname === item.href ? 'bg-muted' : ''
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
