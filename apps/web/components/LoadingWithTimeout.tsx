"use client"

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingWithTimeoutProps {
    timeout?: number // milliseconds
    onTimeout?: () => void
    message?: string
}

export function LoadingWithTimeout({
    timeout = 3000,
    onTimeout,
    message = "Loading..."
}: LoadingWithTimeoutProps) {
    const [timedOut, setTimedOut] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true)
            onTimeout?.()
        }, timeout)

        return () => clearTimeout(timer)
    }, [timeout, onTimeout])

    if (timedOut) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
                <div className="text-amber-600 mb-4">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Taking longer than expected</h3>
                <p className="text-sm text-gray-600 mb-4">The page is loading slowly. Please wait or try refreshing.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-gray-600">{message}</p>
        </div>
    )
}

// Fast loading spinner for quick operations
export function QuickLoader({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="flex items-center justify-center gap-2 p-4">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm text-gray-600">{message}</span>
        </div>
    )
}
