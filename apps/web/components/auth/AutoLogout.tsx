'use client'

import { useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export default function AutoLogout() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const lastActivity = useRef(Date.now())
    const timerRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        // Only track if user is logged in
        if (!session?.user) return

        // Don't auto-logout if already on auth pages
        if (pathname?.startsWith('/auth')) return

        // Reset timer on activity
        const resetTimer = () => {
            lastActivity.current = Date.now()
        }

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click']

        // Attach listeners
        events.forEach(event => window.addEventListener(event, resetTimer))

        // Check for inactivity
        timerRef.current = setInterval(() => {
            const now = Date.now()
            const elapsed = now - lastActivity.current

            if (elapsed >= IDLE_TIMEOUT_MS) {
                console.log('User inactive for 5 mins - Auto Logging Out')
                if (timerRef.current) clearInterval(timerRef.current)

                // Sign out and redirect to login
                signOut({ callbackUrl: '/auth/login?reason=idle_timeout' })
            }
        }, 5000) // Check every 5 seconds

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer))
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [session, pathname])

    return null
}
