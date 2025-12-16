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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const isAuth = pathname?.startsWith('/auth')
  const isLogin = pathname === '/auth/login'
  const isRegister = pathname === '/auth/register'
  const isHome = pathname === '/'
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/super-admin')
  // Hide header actions on all auth pages (login, register, forgot/reset password, etc.)
  const hideHeaderActions = isAuth || (isHome && status === 'unauthenticated')
  // Route logo to dashboard if authenticated, otherwise to landing page
  const logoHref = status === 'authenticated' ? '/dashboard' : '/'


  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Use tight horizontal padding so the logo sits near the absolute corner */}
        <div className="mx-auto w-full px-2 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
