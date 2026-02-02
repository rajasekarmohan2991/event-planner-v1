/**
 * React Query Provider Setup
 * Provides client-side caching, automatic refetching, and optimistic updates
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Cache data for 5 minutes by default
                        staleTime: 5 * 60 * 1000,
                        // Keep unused data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Retry failed requests 1 time
                        retry: 1,
                        // Refetch on window focus for fresh data
                        refetchOnWindowFocus: true,
                        // Refetch on reconnect
                        refetchOnReconnect: true,
                        // Don't refetch on mount if data is fresh
                        refetchOnMount: false,
                    },
                    mutations: {
                        // Retry failed mutations once
                        retry: 1,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Show React Query DevTools in development */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            )}
        </QueryClientProvider>
    )
}
