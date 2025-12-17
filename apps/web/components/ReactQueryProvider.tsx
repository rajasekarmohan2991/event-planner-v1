"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: Data is considered fresh for 30 seconds
                        staleTime: 30 * 1000,
                        // Cache time: Keep unused data in cache for 5 minutes
                        cacheTime: 5 * 60 * 1000,
                        // Retry failed requests 1 time
                        retry: 1,
                        // Refetch on window focus for fresh data
                        refetchOnWindowFocus: true,
                        // Don't refetch on mount if data is fresh
                        refetchOnMount: false,
                        // Don't refetch on reconnect if data is fresh
                        refetchOnReconnect: false,
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
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            )}
        </QueryClientProvider>
    )
}
