'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SessionProvider } from '@/components/SessionProvider'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
// Service Worker DISABLED - was causing blank page issues
// import { ServiceWorkerProvider } from '@/lib/useServiceWorker'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        {/* <ServiceWorkerProvider> */}
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        {/* </ServiceWorkerProvider> */}
      </SessionProvider>
    </ErrorBoundary>
  )
}
