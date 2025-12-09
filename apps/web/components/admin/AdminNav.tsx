'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { User } from 'next-auth'
import { LayoutDashboard, Users, Calendar, Settings, LogOut } from 'lucide-react'

interface AdminNavProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  } | null
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Events',
      href: '/admin/events',
      icon: Calendar,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  if (!user) {
    return null
  }

  return (
    <div className="hidden border-r bg-gray-100/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4">
          <Link className="flex items-center gap-2 font-semibold" href="/admin">
            <span>Event Planner Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900',
                    isActive && 'bg-gray-100 text-gray-900'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="p-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
