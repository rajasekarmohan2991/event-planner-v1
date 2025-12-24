'use client'

import { useEffect, useRef } from 'react'

// Performance monitoring hook
export function usePerformanceMonitor(pageName: string) {
    const startTime = useRef<number>(0)

    useEffect(() => {
        startTime.current = performance.now()

        return () => {
            const endTime = performance.now()
            const loadTime = endTime - startTime.current

            // Log performance metrics
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.log(`📊 Performance [${pageName}]:`, {
                    loadTime: `${loadTime.toFixed(2)}ms`,
                    rating: loadTime < 500 ? '✅ Excellent' : loadTime < 1000 ? '⚠️ Good' : '❌ Needs improvement'
                })
            }

            // Send to analytics (optional)
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'page_load_time', {
                    page_name: pageName,
                    load_time: Math.round(loadTime),
                })
            }
        }
    }, [pageName])
}

// API call performance tracker
export async function trackApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
): Promise<T> {
    const start = performance.now()

    try {
        const result = await apiCall()
        const duration = performance.now() - start

        if (process.env.NODE_ENV === 'development') {
            console.log(`🌐 API Call [${name}]:`, {
                duration: `${duration.toFixed(2)}ms`,
                status: '✅ Success'
            })
        }

        return result
    } catch (error) {
        const duration = performance.now() - start

        if (process.env.NODE_ENV === 'development') {
            console.error(`🌐 API Call [${name}]:`, {
                duration: `${duration.toFixed(2)}ms`,
                status: '❌ Failed',
                error
            })
        }

        throw error
    }
}

// Component render tracker
export function useRenderCount(componentName: string) {
    const renderCount = useRef(0)

    useEffect(() => {
        renderCount.current += 1

        if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Render [${componentName}]: ${renderCount.current} times`)

            if (renderCount.current > 5) {
                console.warn(`⚠️ ${componentName} has rendered ${renderCount.current} times - check for unnecessary re-renders`)
            }
        }
    })
}

// Example usage:
/*
function MyPage() {
  usePerformanceMonitor('MyPage')
  useRenderCount('MyPage')
  
  const loadData = async () => {
    const data = await trackApiCall('fetchUsers', () => 
      fetch('/api/users').then(r => r.json())
    )
    return data
  }
  
  return <div>...</div>
}
*/

declare global {
    interface Window {
        gtag?: (...args: any[]) => void
    }
}
