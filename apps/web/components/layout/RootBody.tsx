"use client"

import { usePathname } from 'next/navigation'
import AppProviders from '@/components/AppProviders'
import { ToastProvider } from '@/contexts/toast-context'
import { Toaster } from '@/components/ui/toaster'
import AppFrame from '@/components/layout/AppFrame'

export default function RootBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isAuth = pathname.startsWith('/auth')

  if (isAuth) {
    // Render auth pages without global providers/AppShell/Toaster to isolate 500s
    return <>{children}</>
  }

  return (
    <AppProviders>
      <ToastProvider>
        <AppFrame>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </AppFrame>
        <Toaster />
      </ToastProvider>
    </AppProviders>
  )
}
