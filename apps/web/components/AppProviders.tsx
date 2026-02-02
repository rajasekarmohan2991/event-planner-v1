'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SessionProvider } from 'next-auth/react'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import AutoLogout from '@/components/auth/AutoLogout'
// Service Worker DISABLED - was causing blank page issues
// import { ServiceWorkerProvider } from '@/lib/useServiceWorker'

import { Session } from 'next-auth'

export default function AppProviders({ children, session }: { children: React.ReactNode, session: Session | null }) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        {/* <ServiceWorkerProvider> */}
        <ReactQueryProvider>
          <AutoLogout />
          {children}
        </ReactQueryProvider>
        {/* </ServiceWorkerProvider> */}
      </SessionProvider>
    </ErrorBoundary>
  )
}
