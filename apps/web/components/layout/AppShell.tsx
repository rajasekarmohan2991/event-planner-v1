'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import MainNav from '@/components/MainNav'
import { ModeToggle } from '@/components/mode-toggle'
import UserNav from '@/components/UserNav'
import NotificationBell from '@/components/NotificationBell'
import FeedButton from '@/components/FeedButton'
import { BrandLogo } from '@/components/BrandLogo'
import { useLocationDetection } from '@/hooks/useLocationDetection'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { location, loading: locationLoading } = useLocationDetection()

  const isAuth = pathname?.startsWith('/auth')
  const isLogin = pathname === '/auth/login'
  const isRegister = pathname === '/auth/register'
  const isHome = pathname === '/'
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/super-admin')
  // Hide header actions on all auth pages (login, register, forgot/reset password, etc.)
  const hideHeaderActions = isAuth || (isHome && status === 'unauthenticated')
  // Route logo to dashboard if authenticated, otherwise to landing page
  const logoHref = status === 'authenticated' ? '/dashboard' : '/'

  const displayLocation = location?.city || 'Detecting...'


  // Check if we're on the event public page or admin pages (admin has its own header)
  const isEventPublicPage = pathname?.match(/^\/events\/\d+\/public$/)
  const hideGlobalHeader = isEventPublicPage || isAdmin

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hide header completely on event public page and admin pages (admin has its own AdminHeader) */}
      {!hideGlobalHeader && (
        <header className="sticky top-0 z-50 border-b bg-white dark:bg-slate-900 shadow-sm">
          {/* Use tight horizontal padding so the logo sits near the absolute corner */}
          <div className="mx-auto w-full px-2 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <Link href="/admin" className="hover:opacity-80 transition-opacity duration-300 ml-0">
                  <BrandLogo variant="light" />
                </Link>
              ) : (
                <>
                  {/* Navigate back when authenticated; landing page otherwise */}
                  <Link
                    href={logoHref}
                    className="hover:opacity-80 transition-opacity duration-300 ml-0"
                  >
                    <BrandLogo variant="light" />
                  </Link>
                </>
              )}

              {/* Location Detection */}
              {!hideHeaderActions && (
                <button
                  className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-white"
                  title={location ? `${location.city}, ${location.state}` : 'Detecting location...'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`h-4 w-4 ${locationLoading ? 'text-gray-400 animate-pulse' : 'text-blue-600'}`}
                  >
                    <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.02 11.22 7.32 11.45.26.19.6.19.86 0 .3-.23 7.32-5.64 7.32-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                  <span className="whitespace-nowrap">{displayLocation}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-slate-500"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Profile/Theme hidden on login page and on public landing */}
              {!hideHeaderActions && (
                <>
                  <FeedButton />
                  <NotificationBell />
                  <UserNav />
                  <ModeToggle />
                </>
              )}
            </div>
          </div>
        </header>
      )}
      {/* Subheader removed: event creation is accessible only from the home page */}

      <main className="flex-1">{children}</main>
      {!isAdmin && (
        <footer className="border-t py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ayphen. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  )
}
