"use client"

import { useEffect } from 'react'

export function useServiceWorker() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            process.env.NODE_ENV === 'production'
        ) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('[SW] Service Worker registered:', registration)

                    // Check for updates every hour
                    setInterval(() => {
                        registration.update()
                    }, 60 * 60 * 1000)
                })
                .catch((error) => {
                    console.error('[SW] Service Worker registration failed:', error)
                })

            // Listen for service worker updates
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[SW] New service worker activated, reloading page...')
                window.location.reload()
            })
        }
    }, [])
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
    useServiceWorker()
    return <>{ children } </>
}
