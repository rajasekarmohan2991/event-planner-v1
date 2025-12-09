'use client'

import Link from 'next/link'
import { UserNav } from './UserNav'
import NotificationBell from '@/components/NotificationBell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminHeader() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/admin" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link 
            href="/admin/events" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Events
          </Link>
          <Link 
            href="/admin/users" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Users
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <NotificationBell />
          
          <UserNav />
        </div>
      </div>
    </header>
  )
}
