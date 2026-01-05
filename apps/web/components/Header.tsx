"use client"

import Link from 'next/link'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotificationBell from '@/components/NotificationBell'
import { BrandLogo } from '@/components/BrandLogo'
import { useLocationDetection } from '@/hooks/useLocationDetection'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const tabs = [
  { href: '/events', label: 'For you' },
  { href: '/events', label: 'Events' },
  { href: '#', label: 'Dining' },
  { href: '#', label: 'Movies' },
  { href: '#', label: 'Activities' },
]

export default function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { location, loading: locationLoading } = useLocationDetection()

  const displayLocation = location?.city || 'Detecting...'

  return (
    <header className="sticky top-0 z-[100] w-full border-b shadow-md" style={{ backgroundColor: '#ffffff', isolation: 'isolate' }}>
      {/* Top bar */}
      <div className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={status === 'authenticated' ? '/dashboard' : '/'} className="flex items-center gap-2">
              <BrandLogo variant="dark" />
            </Link>

            {/* Location chip (desktop) */}
            <button
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm transition hover:bg-gray-50 md:flex"
              aria-label="Change location"
              title={location ? `${location.city}, ${location.state}` : 'Detecting location...'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`h-4 w-4 ${locationLoading ? 'text-gray-400 animate-pulse' : 'text-blue-600'}`}
                aria-hidden="true"
              >
                <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.02 11.22 7.32 11.45.26.19.6.19.86 0 .3-.23 7.32-5.64 7.32-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
              </svg>
              <span className="whitespace-nowrap">{displayLocation}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-slate-500"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Search pill (desktop) */}
          <div className="flex-1 px-4 md:px-6">
            <div className="mx-auto hidden max-w-xl items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-black/5 transition focus-within:border-slate-300 focus-within:ring-blue-100 md:flex">
              <MagnifyingGlassIcon />
              <input
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
                placeholder="Search for events, movies and restaurants"
                aria-label="Search"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === 'authenticated' && session?.user ? (
              <>
                {/* Notification Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 rounded-full ring-1 ring-black/5 bg-white shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                      </svg>
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end" forceMount>
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-96 overflow-y-auto">
                      <DropdownMenuItem className="flex-col items-start gap-1 p-3">
                        <div className="flex items-center gap-2 w-full">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <p className="text-sm font-medium">Event Registration Approved</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">Your registration for Tech Conference 2025 has been approved</p>
                        <p className="text-xs text-muted-foreground pl-4 mt-1">2 hours ago</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex-col items-start gap-1 p-3">
                        <div className="flex items-center gap-2 w-full">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <p className="text-sm font-medium">Payment Successful</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">Payment of ₹50.00 received for event registration</p>
                        <p className="text-xs text-muted-foreground pl-4 mt-1">5 hours ago</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-center p-3 text-sm text-muted-foreground">
                        No more notifications
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 rounded-full ring-1 ring-black/5 overflow-hidden bg-white shadow-sm">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || session.user.email || ''} />
                        <AvatarFallback>
                          {String(session.user.name || session.user.email || 'U')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name || 'Account'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    {/* Sign out removed per requirement */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm">
          <div className="relative flex items-center gap-1 rounded-full bg-gray-100 p-1">
            {tabs.map((t) => {
              const active = pathname ? (t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)) : false
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`relative z-10 rounded-full px-3 py-1.5 ${active ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {t.label}
                  {active && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-white shadow"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile search and location */}
      <div className="border-b bg-white p-2 md:hidden">
        <div className="mb-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
          <MagnifyingGlassIcon />
          <input className="w-full bg-transparent outline-none" placeholder="Search for events" aria-label="Search" />
        </div>
        <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-blue-600">
            <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.02 11.22 7.32 11.45.26.19.6.19.86 0 .3-.23 7.32-5.64 7.32-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <span className="whitespace-nowrap">Kodandaram Nagar</span>
        </button>
      </div>
    </header>
  )
}
