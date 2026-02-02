'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import GlobalLoader from './GlobalLoader'

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        // Show loader on route change
        setLoading(true)
        const timer = setTimeout(() => setLoading(false), 500)
        return () => clearTimeout(timer)
    }, [pathname])

    return (
        <>
            {loading && <GlobalLoader />}
            {children}
        </>
    )
}
