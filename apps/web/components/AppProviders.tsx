'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SessionProvider } from '@/components/SessionProvider'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import { ServiceWorkerProvider } from '@/lib/useServiceWorker'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <SessionProvider>
          <ServiceWorkerProvider>
            {children}
          </ServiceWorkerProvider>
        </SessionProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  )
}
