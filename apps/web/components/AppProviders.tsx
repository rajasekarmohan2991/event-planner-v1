'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SessionProvider } from '@/components/SessionProvider'
// Temporarily disabled to debug blank page issue
// import { ReactQueryProvider } from '@/components/ReactQueryProvider'
// import { ServiceWorkerProvider } from '@/lib/useServiceWorker'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ErrorBoundary>
  )
}
