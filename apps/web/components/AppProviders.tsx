'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SessionProvider } from '@/components/SessionProvider'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ErrorBoundary>
  )
}
